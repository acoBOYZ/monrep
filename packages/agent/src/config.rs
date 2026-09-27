//! Paths for the local agent config / credential store.

use directories::ProjectDirs;
use std::path::PathBuf;

const QUALIFIER: &str = "dev";
const ORGANIZATION: &str = "monrep";
const APPLICATION: &str = "agent";

/// XDG-style config directory for this agent (`…/monrep/agent`).
pub fn config_dir() -> anyhow::Result<PathBuf> {
  let dirs = ProjectDirs::from(QUALIFIER, ORGANIZATION, APPLICATION)
    .ok_or_else(|| anyhow::anyhow!("could not resolve config directory"))?;
  Ok(dirs.config_dir().to_path_buf())
}

/// Path to the device credential file (`cred.json`).
pub fn cred_path() -> anyhow::Result<PathBuf> {
  Ok(config_dir()?.join("cred.json"))
}

/// Path to local settings (`config.json`) — autoUpdate etc.
pub fn settings_path() -> anyhow::Result<PathBuf> {
  Ok(config_dir()?.join("config.json"))
}
