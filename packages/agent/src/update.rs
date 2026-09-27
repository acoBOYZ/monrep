//! Self-update from GitHub Releases (linux x86_64 / aarch64).

use crate::brand;
use crate::error::{AgentError, Result};
use fs_err as fs;
use serde::Deserialize;
use std::env::consts::{ARCH, OS};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;
#[cfg(unix)]
use std::os::unix::process::CommandExt;

pub use brand::RELEASE_REPO;
pub const AUTO_UPDATE_INTERVAL_SECS: u64 = 6 * 60 * 60;

#[derive(Debug, Clone)]
pub struct ReleaseInfo {
  pub tag: String,
  pub version: String,
  pub download_url: String,
}

#[derive(Debug, Deserialize)]
struct GhRelease {
  tag_name: String,
  assets: Vec<GhAsset>,
}

#[derive(Debug, Deserialize)]
struct GhAsset {
  name: String,
  browser_download_url: String,
}

fn asset_name() -> Result<&'static str> {
  if OS != "linux" {
    return Err(AgentError::Other(anyhow::anyhow!(
      "self-update supports Linux only (os={OS})"
    )));
  }
  match ARCH {
    "x86_64" => Ok(brand::RELEASE_ASSET_X86_64),
    "aarch64" => Ok(brand::RELEASE_ASSET_AARCH64),
    other => Err(AgentError::Other(anyhow::anyhow!(
      "unsupported arch for self-update: {other}"
    ))),
  }
}

fn strip_v(tag: &str) -> &str {
  tag.strip_prefix('v').unwrap_or(tag)
}

/// Compare semver-ish strings (digits and dots). Returns true if `remote` is newer than `local`.
pub fn is_newer(remote: &str, local: &str) -> bool {
  let parse = |s: &str| -> Vec<u64> {
    strip_v(s)
      .split('.')
      .filter_map(|p| p.parse::<u64>().ok())
      .collect()
  };
  let a = parse(remote);
  let b = parse(local);
  let n = a.len().max(b.len());
  for i in 0..n {
    let x = a.get(i).copied().unwrap_or(0);
    let y = b.get(i).copied().unwrap_or(0);
    if x != y {
      return x > y;
    }
  }
  false
}

pub async fn fetch_latest_release() -> Result<ReleaseInfo> {
  let asset = asset_name()?;
  let url = format!("https://api.github.com/repos/{RELEASE_REPO}/releases/latest");
  let client = reqwest::Client::builder()
    .user_agent(format!("monrep/{}", env!("CARGO_PKG_VERSION")))
    .build()
    .map_err(|e| AgentError::Other(anyhow::anyhow!(e)))?;
  let release: GhRelease = client
    .get(&url)
    .send()
    .await
    .map_err(|e| AgentError::Other(anyhow::anyhow!("github releases: {e}")))?
    .error_for_status()
    .map_err(|e| AgentError::Other(anyhow::anyhow!("github releases: {e}")))?
    .json()
    .await
    .map_err(|e| AgentError::Other(anyhow::anyhow!("github releases json: {e}")))?;

  let asset_row = release
    .assets
    .iter()
    .find(|a| a.name == asset)
    .ok_or_else(|| {
      AgentError::Other(anyhow::anyhow!(
        "release {} has no asset {asset}",
        release.tag_name
      ))
    })?;

  Ok(ReleaseInfo {
    tag: release.tag_name.clone(),
    version: strip_v(&release.tag_name).to_string(),
    download_url: asset_row.browser_download_url.clone(),
  })
}

pub async fn check_for_update() -> Result<Option<ReleaseInfo>> {
  let local = env!("CARGO_PKG_VERSION");
  let remote = fetch_latest_release().await?;
  if is_newer(&remote.version, local) {
    Ok(Some(remote))
  } else {
    Ok(None)
  }
}

async fn download_to(path: &Path, url: &str) -> Result<()> {
  let client = reqwest::Client::builder()
    .user_agent(format!("monrep/{}", env!("CARGO_PKG_VERSION")))
    .build()
    .map_err(|e| AgentError::Other(anyhow::anyhow!(e)))?;
  let bytes = client
    .get(url)
    .send()
    .await
    .map_err(|e| AgentError::Other(anyhow::anyhow!("download: {e}")))?
    .error_for_status()
    .map_err(|e| AgentError::Other(anyhow::anyhow!("download: {e}")))?
    .bytes()
    .await
    .map_err(|e| AgentError::Other(anyhow::anyhow!("download body: {e}")))?;
  {
    let mut f = fs::File::create(path)?;
    f.write_all(&bytes)?;
    f.sync_all()?;
  }
  #[cfg(unix)]
  {
    let perms = std::fs::Permissions::from_mode(0o755);
    fs::set_permissions(path, perms)?;
  }
  Ok(())
}

fn current_exe_path() -> Result<PathBuf> {
  std::env::current_exe().map_err(|e| AgentError::Other(anyhow::anyhow!(e)))
}

/// Download and atomically replace the running binary. Does not re-exec.
pub async fn apply_update(info: &ReleaseInfo) -> Result<PathBuf> {
  let exe = current_exe_path()?;
  let parent = exe.parent().ok_or_else(|| {
    AgentError::Other(anyhow::anyhow!(
      "current exe has no parent: {}",
      exe.display()
    ))
  })?;
  let tmp = parent.join(format!(".monrep-update-{}.tmp", std::process::id()));
  download_to(&tmp, &info.download_url).await?;

  let backup = parent.join(format!(".monrep-prev-{}", std::process::id()));
  if let Err(e) = fs::rename(&exe, &backup) {
    let _ = fs::remove_file(&tmp);
    return Err(AgentError::Other(anyhow::anyhow!(
      "cannot replace binary (writable?): {e}"
    )));
  }
  if let Err(e) = fs::rename(&tmp, &exe) {
    let _ = fs::rename(&backup, &exe);
    let _ = fs::remove_file(&tmp);
    return Err(AgentError::Other(anyhow::anyhow!(
      "failed to install new binary: {e}"
    )));
  }
  let _ = fs::remove_file(&backup);
  Ok(exe)
}

pub fn reexec_public(exe: &Path) -> Result<()> {
  reexec(exe)
}

fn reexec(exe: &Path) -> Result<()> {
  #[cfg(unix)]
  {
    let args: Vec<String> = std::env::args().collect();
    let err = Command::new(exe).args(&args[1..]).exec();
    Err(AgentError::Other(anyhow::anyhow!("reexec failed: {err}")))
  }
  #[cfg(not(unix))]
  {
    let _ = exe;
    Err(AgentError::Other(anyhow::anyhow!(
      "reexec after update is Unix-only; restart monrep manually"
    )))
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn newer_compares() {
    assert!(is_newer("0.2.0", "0.1.0"));
    assert!(is_newer("v1.0.1", "1.0.0"));
    assert!(!is_newer("0.1.0", "0.1.0"));
    assert!(!is_newer("0.1.0", "0.2.0"));
  }
}
