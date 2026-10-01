//! Paths for the local agent config / credential store.

use directories::BaseDirs;
use std::path::PathBuf;

/// XDG-style config directory for this agent (`$XDG_CONFIG_HOME/monrep/agent`).
pub fn config_dir() -> anyhow::Result<PathBuf> {
  let dirs =
    BaseDirs::new().ok_or_else(|| anyhow::anyhow!("could not resolve config directory"))?;
  Ok(dirs.config_dir().join("monrep").join("agent"))
}

/// Path to the device credential file (`cred.json`).
pub fn cred_path() -> anyhow::Result<PathBuf> {
  Ok(config_dir()?.join("cred.json"))
}

/// Path to local settings (`config.json`) — autoUpdate etc.
pub fn settings_path() -> anyhow::Result<PathBuf> {
  Ok(config_dir()?.join("config.json"))
}

/// Path to local metrics SQLite DB.
pub fn metrics_db_path() -> anyhow::Result<PathBuf> {
  Ok(config_dir()?.join("metrics.sqlite"))
}
