//! Local agent settings (`config.json`) — autoUpdate defaults to true.

use crate::config;
use crate::error::{AgentError, Result};
use fs_err as fs;
use serde::{Deserialize, Serialize};
use std::io::Write;

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSettings {
  /// When true, daemon periodically checks GitHub for a newer binary.
  #[serde(default = "default_true")]
  pub auto_update: bool,
}

fn default_true() -> bool {
  true
}

impl Default for AgentSettings {
  fn default() -> Self {
    Self { auto_update: true }
  }
}

pub fn load_settings() -> Result<AgentSettings> {
  let path = config::settings_path().map_err(AgentError::Other)?;
  if !path.exists() {
    return Ok(AgentSettings::default());
  }
  let raw = fs::read_to_string(&path)?;
  let mut settings: AgentSettings =
    serde_json::from_str(&raw).map_err(|e| AgentError::CorruptStore(e.to_string()))?;
  // Missing field already defaults via serde; keep explicit.
  let _ = &mut settings;
  Ok(settings)
}

pub fn save_settings(settings: &AgentSettings) -> Result<()> {
  let dir = config::config_dir().map_err(AgentError::Other)?;
  fs::create_dir_all(&dir)?;
  let path = config::settings_path().map_err(AgentError::Other)?;
  let tmp = path.with_extension("json.tmp");
  {
    let mut f = fs::File::create(&tmp)?;
    let json = serde_json::to_vec_pretty(settings)?;
    f.write_all(&json)?;
    f.write_all(b"\n")?;
    f.sync_all()?;
  }
  #[cfg(unix)]
  {
    let perms = std::fs::Permissions::from_mode(0o600);
    fs::set_permissions(&tmp, perms.clone())?;
    fs::rename(&tmp, &path)?;
    fs::set_permissions(&path, perms)?;
  }
  #[cfg(not(unix))]
  {
    fs::rename(&tmp, &path)?;
  }
  Ok(())
}

pub fn set_auto_update(enabled: bool) -> Result<AgentSettings> {
  let mut settings = load_settings()?;
  settings.auto_update = enabled;
  save_settings(&settings)?;
  Ok(settings)
}

pub fn auto_update_enabled() -> bool {
  load_settings().map(|s| s.auto_update).unwrap_or(true)
}

pub fn settings_file_exists() -> bool {
  config::settings_path().map(|p| p.exists()).unwrap_or(false)
}
