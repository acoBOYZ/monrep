//! 0600 device credential store — one pinned control_url per agent.

use crate::config;
use crate::error::{AgentError, Result};
use fs_err as fs;
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::Path;

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceCred {
  pub control_url: String,
  pub device_id: String,
  /// Device secret / enroll material — never print.
  pub token: String,
}

pub fn load() -> Result<DeviceCred> {
  let path = config::cred_path().map_err(AgentError::Other)?;
  if !path.exists() {
    return Err(AgentError::NotEnrolled);
  }
  let raw = fs::read_to_string(&path)?;
  let cred: DeviceCred =
    serde_json::from_str(&raw).map_err(|e| AgentError::CorruptStore(e.to_string()))?;
  if cred.control_url.is_empty() || cred.device_id.is_empty() {
    return Err(AgentError::CorruptStore(
      "missing control_url or device_id".into(),
    ));
  }
  Ok(cred)
}

pub fn load_optional() -> Result<Option<DeviceCred>> {
  match load() {
    Ok(c) => Ok(Some(c)),
    Err(AgentError::NotEnrolled) => Ok(None),
    Err(e) => Err(e),
  }
}

pub fn save(cred: &DeviceCred) -> Result<()> {
  let dir = config::config_dir().map_err(AgentError::Other)?;
  fs::create_dir_all(&dir)?;
  let path = config::cred_path().map_err(AgentError::Other)?;
  let tmp = path.with_extension("json.tmp");
  {
    let mut f = fs::File::create(&tmp)?;
    let json = serde_json::to_vec_pretty(cred)?;
    f.write_all(&json)?;
    f.write_all(b"\n")?;
    f.sync_all()?;
  }
  set_owner_rw(&tmp)?;
  fs::rename(&tmp, &path)?;
  set_owner_rw(&path)?;
  Ok(())
}

/// Refuse connecting to a different origin than the pin.
pub fn assert_pinned_url(cred: &DeviceCred, attempted: &str) -> Result<()> {
  let pinned = normalize_url(&cred.control_url);
  let attempt = normalize_url(attempted);
  if pinned != attempt {
    return Err(AgentError::BindingMismatch {
      pinned,
      attempted: attempt,
    });
  }
  Ok(())
}

fn normalize_url(url: &str) -> String {
  url.trim().trim_end_matches('/').to_string()
}

fn set_owner_rw(path: &Path) -> Result<()> {
  #[cfg(unix)]
  {
    let perms = std::fs::Permissions::from_mode(0o600);
    fs::set_permissions(path, perms)?;
  }
  #[cfg(not(unix))]
  {
    let _ = path;
  }
  Ok(())
}
