//! Clap surface: enroll / unenroll / status / daemon / update / config.

use crate::error::AgentError;
use crate::health::HealthBus;
use crate::proto::HealthLevel;
use crate::settings;
use crate::store;
use crate::supervisor;
use crate::update;
use clap::{Parser, Subcommand};
use std::io::Write;

#[derive(Debug, Parser)]
#[command(name = "monrep", about = "monrep outbound tunnel agent", version)]
pub struct Cli {
  #[command(subcommand)]
  pub command: Command,
}

#[derive(Debug, Subcommand)]
pub enum Command {
  /// Bind this host to one control plane (1:1). Refuses if already enrolled.
  Enroll {
    /// Control plane base URL (https://…)
    #[arg(long)]
    url: String,
    /// One-time enrollment token from the dashboard
    #[arg(long)]
    token: String,
  },
  /// Clear local device credentials so this host can enroll again.
  Unenroll,
  /// Show enrollment status (no secrets)
  Status,
  /// Run supervised outbound tunnel runtime
  Daemon,
  /// Check / apply self-update from GitHub Releases
  Update {
    /// Only report whether an update is available
    #[arg(long)]
    check: bool,
  },
  /// Show or set local agent settings
  Config {
    /// Enable or disable daemon auto-update (`true` / `false`)
    #[arg(long, value_name = "BOOL", num_args = 0..=1, default_missing_value = "true")]
    auto_update: Option<bool>,
  },
}

pub async fn run(cli: Cli) -> anyhow::Result<()> {
  match cli.command {
    Command::Enroll { url, token } => cmd_enroll(&url, &token).await,
    Command::Unenroll => cmd_unenroll(),
    Command::Status => cmd_status(),
    Command::Daemon => cmd_daemon().await,
    Command::Update { check } => cmd_update(check).await,
    Command::Config { auto_update } => cmd_config(auto_update),
  }
}

async fn cmd_enroll(url: &str, token: &str) -> anyhow::Result<()> {
  if url.trim().is_empty() || token.trim().is_empty() {
    anyhow::bail!("--url and --token are required");
  }
  if let Some(existing) = store::load_optional()? {
    anyhow::bail!(
      "already enrolled to {}; run monrep unenroll before binding again",
      existing.control_url
    );
  }

  let cred = crate::http::enroll_with_control_plane(url, token).await?;
  store::save(&cred)?;
  // Ensure default settings file exists (autoUpdate: true).
  let _ = settings::load_settings()?;
  if !settings::settings_file_exists() {
    settings::save_settings(&settings::AgentSettings::default())?;
  }
  out(&format!(
    "enrolled device {} → {}",
    cred.device_id, cred.control_url
  ))?;
  Ok(())
}

fn cmd_unenroll() -> anyhow::Result<()> {
  let path = crate::config::cred_path()?;
  if store::clear()? {
    out(&format!("unenrolled; cleared {}", path.display()))?;
  } else {
    out("not enrolled")?;
  }
  Ok(())
}

fn cmd_status() -> anyhow::Result<()> {
  let settings_path = crate::config::settings_path()?;
  match store::load_optional()? {
    None => {
      out("status: not enrolled")?;
      out(&format!("  settings:    {}", settings_path.display()))?;
    }
    Some(cred) => {
      out("status: enrolled")?;
      out(&format!("  control_url: {}", cred.control_url))?;
      out(&format!("  device_id:   {}", cred.device_id))?;
      out(&format!(
        "  auto_update: {}",
        settings::auto_update_enabled()
      ))?;
      out(&format!("  settings:    {}", settings_path.display()))?;
      out(&format!("  version:     {}", env!("CARGO_PKG_VERSION")))?;
      let health = HealthBus::new();
      if let Some(last) = health.last() {
        out(&format!("  last_health: {} {}", last.code, last.message))?;
      } else {
        out("  last_health: (none)")?;
      }
    }
  }
  Ok(())
}

async fn cmd_daemon() -> anyhow::Result<()> {
  match store::load() {
    Ok(cred) => {
      out(&format!(
        "daemon: pinned peer {} (device {})",
        cred.control_url, cred.device_id
      ))?;
      out(&format!(
        "daemon: auto_update={}",
        settings::auto_update_enabled()
      ))?;
      if let Some(ca) = crate::tls::active_dev_ca_path() {
        out(&format!("daemon: dev_ca={}", ca.display()))?;
      }
      out("daemon: supervisor running (ctrl-c to stop)")?;
      supervisor::run_forever().await
    }
    Err(AgentError::NotEnrolled) => {
      let mut health = HealthBus::new();
      health.emit(
        HealthLevel::Error,
        "not_enrolled",
        "daemon requires enroll first",
      );
      anyhow::bail!("not enrolled; run `monrep enroll --url <url> --token <token>` first")
    }
    Err(e) => Err(e.into()),
  }
}

async fn cmd_update(check_only: bool) -> anyhow::Result<()> {
  match update::check_for_update().await? {
    None => {
      out(&format!("up to date ({})", env!("CARGO_PKG_VERSION")))?;
      Ok(())
    }
    Some(info) => {
      out(&format!(
        "update available: {} → {} ({})",
        env!("CARGO_PKG_VERSION"),
        info.version,
        info.tag
      ))?;
      if check_only {
        return Ok(());
      }
      out("downloading…")?;
      let exe = update::apply_update(&info).await?;
      out(&format!("installed {}; re-executing", exe.display()))?;
      update::reexec_public(&exe)?;
      Ok(())
    }
  }
}

fn cmd_config(auto_update: Option<bool>) -> anyhow::Result<()> {
  let path = crate::config::settings_path()?;
  if let Some(v) = auto_update {
    let s = settings::set_auto_update(v)?;
    out(&format!("auto_update set to {}", s.auto_update))?;
    out(&format!("settings: {}", path.display()))?;
  } else {
    let s = settings::load_settings()?;
    out(&format!("auto_update: {}", s.auto_update))?;
    out(&format!("settings: {}", path.display()))?;
  }
  Ok(())
}

fn out(line: &str) -> std::io::Result<()> {
  let mut stdout = std::io::stdout().lock();
  writeln!(stdout, "{line}")
}
