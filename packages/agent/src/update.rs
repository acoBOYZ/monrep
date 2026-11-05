//! Self-update from GitHub Releases (linux `x86_64` / `aarch64`).

use crate::brand;
use crate::error::{AgentError, Result};
use crate::version::{
  PREV_PREFIX, UPDATE_TMP_PREFIX, UPDATE_TMP_SUFFIX, is_newer, is_update_artifact, strip_v,
};
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

/// Remove leftover `.monrep-update-*.tmp` / `.monrep-prev-*` beside the binary.
fn purge_update_artifacts(dir: &Path, keep: Option<&Path>) {
  let Ok(entries) = fs::read_dir(dir) else {
    return;
  };
  for entry in entries.flatten() {
    let path = entry.path();
    if keep.is_some_and(|k| k == path.as_path()) {
      continue;
    }
    let Some(name) = path.file_name().and_then(|n| n.to_str()) else {
      continue;
    };
    if is_update_artifact(name) {
      let _ = fs::remove_file(&path);
    }
  }
}

async fn download_to(path: &Path, url: &str) -> Result<()> {
  let client = reqwest::Client::builder()
    .user_agent(format!("monrep/{}", env!("CARGO_PKG_VERSION")))
    .build()
    .map_err(|e| AgentError::Other(anyhow::anyhow!(e)))?;
  let response = client
    .get(url)
    .send()
    .await
    .map_err(|e| AgentError::Other(anyhow::anyhow!("download: {e}")))?
    .error_for_status()
    .map_err(|e| AgentError::Other(anyhow::anyhow!("download: {e}")))?;
  let bytes = response
    .bytes()
    .await
    .map_err(|e| AgentError::Other(anyhow::anyhow!("download body: {e}")))?;
  let path = path.to_path_buf();
  tokio::task::spawn_blocking(move || {
    let mut f = fs::File::create(&path)?;
    f.write_all(&bytes)?;
    f.sync_all()?;
    #[cfg(unix)]
    {
      let perms = std::fs::Permissions::from_mode(0o755);
      fs::set_permissions(&path, perms)?;
    }
    Ok(())
  })
  .await
  .map_err(|e| AgentError::Other(anyhow::anyhow!("download write: {e}")))?
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
  purge_update_artifacts(parent, None);

  let tmp = parent.join(format!(
    "{UPDATE_TMP_PREFIX}{}{UPDATE_TMP_SUFFIX}",
    std::process::id()
  ));
  if let Err(e) = download_to(&tmp, &info.download_url).await {
    let _ = fs::remove_file(&tmp);
    return Err(e);
  }

  let backup = parent.join(format!("{PREV_PREFIX}{}", std::process::id()));
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
  purge_update_artifacts(parent, None);
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
