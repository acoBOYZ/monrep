//! Local agent settings (`config.json`) — auto_update defaults to true.

use crate::config;
use crate::error::{AgentError, Result};
use fs_err as fs;
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::Path;

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AgentSettings {
  /// When true, daemon periodically checks GitHub for a newer binary.
  #[serde(default = "default_true", alias = "autoUpdate")]
  pub auto_update: bool,
  /// When true, scrape host metrics into local SQLite.
  #[serde(default = "default_true", alias = "metricsEnabled")]
  pub metrics_enabled: bool,
  /// Scrape interval seconds (min 5).
  #[serde(default = "default_interval", alias = "metricsIntervalSec")]
  pub metrics_interval_sec: u64,
}

fn default_true() -> bool {
  true
}

fn default_interval() -> u64 {
  30
}

impl Default for AgentSettings {
  fn default() -> Self {
    Self {
      auto_update: true,
      metrics_enabled: true,
      metrics_interval_sec: 30,
    }
  }
}

pub fn load_settings_from(path: &Path) -> Result<AgentSettings> {
  if !path.exists() {
    return Ok(AgentSettings::default());
  }
  let raw = fs::read_to_string(path)?;
  let settings: AgentSettings =
    serde_json::from_str(&raw).map_err(|e| AgentError::CorruptStore(e.to_string()))?;
  Ok(settings)
}

pub fn save_settings_to(path: &Path, settings: &AgentSettings) -> Result<()> {
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent)?;
  }
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
    fs::rename(&tmp, path)?;
    fs::set_permissions(path, perms)?;
  }
  #[cfg(not(unix))]
  {
    fs::rename(&tmp, path)?;
  }
  Ok(())
}

pub fn load_settings() -> Result<AgentSettings> {
  let path = config::settings_path().map_err(AgentError::Other)?;
  load_settings_from(&path)
}

pub fn save_settings(settings: &AgentSettings) -> Result<()> {
  let path = config::settings_path().map_err(AgentError::Other)?;
  save_settings_to(&path, settings)
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

pub fn apply_metrics_config(
  enabled: Option<bool>,
  interval_sec: Option<u64>,
) -> Result<AgentSettings> {
  let mut settings = load_settings()?;
  if let Some(v) = enabled {
    settings.metrics_enabled = v;
  }
  if let Some(v) = interval_sec {
    settings.metrics_interval_sec = v.max(5);
  }
  save_settings(&settings)?;
  Ok(settings)
}

pub fn metrics_enabled() -> bool {
  load_settings().map(|s| s.metrics_enabled).unwrap_or(true)
}

pub fn metrics_interval_sec() -> u64 {
  load_settings()
    .map(|s| s.metrics_interval_sec.max(5))
    .unwrap_or(30)
}

pub fn settings_file_exists() -> bool {
  config::settings_path().map(|p| p.exists()).unwrap_or(false)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn roundtrip_false() {
    let dir = std::env::temp_dir().join(format!("monrep-settings-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    let path = dir.join("config.json");
    save_settings_to(
      &path,
      &AgentSettings {
        auto_update: false,
        ..Default::default()
      },
    )
    .unwrap();
    let loaded = load_settings_from(&path).unwrap();
    assert!(!loaded.auto_update);
    let _ = fs::remove_dir_all(&dir);
  }

  #[test]
  fn accepts_camel_case_alias() {
    let dir = std::env::temp_dir().join(format!("monrep-settings-camel-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    let path = dir.join("config.json");
    fs::write(&path, "{\n  \"autoUpdate\": false\n}\n").unwrap();
    let loaded = load_settings_from(&path).unwrap();
    assert!(!loaded.auto_update);
    let _ = fs::remove_dir_all(&dir);
  }
}
