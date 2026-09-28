//! Clap surface: link / unlink / status / run / upgrade / settings / init.

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
  /// Bind this host to one control plane (1:1). Refuses if already linked.
  Link {
    /// Control plane base URL (https://…)
    #[arg(long)]
    url: String,
    /// One-time enroll token from the dashboard
    #[arg(long)]
    token: String,
  },
  /// Clear local device credentials so this host can link again.
  Unlink,
  /// Show link status (no secrets)
  Status,
  /// Run supervised outbound tunnel runtime (foreground)
  Run,
  /// Check / apply self-upgrade from GitHub Releases
  Upgrade {
    /// Only report whether an upgrade is available
    #[arg(long)]
    check: bool,
  },
  /// Show or set local agent settings
  Settings {
    /// Enable or disable auto-upgrade (`true` / `false`)
    #[arg(long, value_name = "BOOL", num_args = 0..=1, default_missing_value = "true")]
    auto_update: Option<bool>,
  },
  /// Link (if needed), install systemd unit, enable and start the agent (Linux, root)
  Init {
    /// Control plane base URL (https://…)
    #[arg(long)]
    url: Option<String>,
    /// One-time enroll token from the dashboard
    #[arg(long)]
    token: Option<String>,
    /// Unlink and re-link when already bound
    #[arg(long)]
    force: bool,
    /// Install/enable unit but do not start
    #[arg(long)]
    no_start: bool,
  },
}

pub async fn run(cli: Cli) -> anyhow::Result<()> {
  match cli.command {
    Command::Link { url, token } => cmd_link(&url, &token).await,
    Command::Unlink => cmd_unlink(),
    Command::Status => cmd_status(),
    Command::Run => cmd_run().await,
    Command::Upgrade { check } => cmd_upgrade(check).await,
    Command::Settings { auto_update } => cmd_settings(auto_update),
    Command::Init {
      url,
      token,
      force,
      no_start,
    } => crate::init::cmd_init(url, token, force, no_start).await,
  }
}

pub(crate) async fn cmd_link(url: &str, token: &str) -> anyhow::Result<()> {
  if url.trim().is_empty() || token.trim().is_empty() {
    anyhow::bail!("--url and --token are required");
  }
  if let Some(existing) = store::load_optional()? {
    anyhow::bail!(
      "already linked to {}; run monrep unlink before binding again",
      existing.control_url
    );
  }

  let cred = crate::http::enroll_with_control_plane(url, token).await?;
  store::save(&cred)?;
  let _ = settings::load_settings()?;
  if !settings::settings_file_exists() {
    settings::save_settings(&settings::AgentSettings::default())?;
  }
  out(&format!(
    "linked device {} → {}",
    cred.device_id, cred.control_url
  ))?;
  Ok(())
}

pub(crate) fn cmd_unlink() -> anyhow::Result<()> {
  let path = crate::config::cred_path()?;
  if store::clear()? {
    out(&format!("unlinked; cleared {}", path.display()))?;
  } else {
    out("not linked")?;
  }
  Ok(())
}

pub(crate) fn cmd_status() -> anyhow::Result<()> {
  let settings_path = crate::config::settings_path()?;
  match store::load_optional()? {
    None => {
      out("status: not linked")?;
      out(&format!("  settings:    {}", settings_path.display()))?;
    }
    Some(cred) => {
      out("status: linked")?;
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

async fn cmd_run() -> anyhow::Result<()> {
  match store::load() {
    Ok(cred) => {
      out(&format!(
        "run: pinned peer {} (device {})",
        cred.control_url, cred.device_id
      ))?;
      out(&format!(
        "run: auto_update={}",
        settings::auto_update_enabled()
      ))?;
      if let Some(ca) = crate::tls::active_dev_ca_path() {
        out(&format!("run: dev_ca={}", ca.display()))?;
      }
      out("run: supervisor running (ctrl-c to stop)")?;
      supervisor::run_forever().await
    }
    Err(AgentError::NotEnrolled) => {
      let mut health = HealthBus::new();
      health.emit(
        HealthLevel::Error,
        "not_enrolled",
        "run requires link first",
      );
      anyhow::bail!("not linked; run `monrep link --url <url> --token <token>` first")
    }
    Err(e) => Err(e.into()),
  }
}

async fn cmd_upgrade(check_only: bool) -> anyhow::Result<()> {
  match update::check_for_update().await? {
    None => {
      out(&format!("up to date ({})", env!("CARGO_PKG_VERSION")))?;
      Ok(())
    }
    Some(info) => {
      out(&format!(
        "upgrade available: {} → {} ({})",
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

fn cmd_settings(auto_update: Option<bool>) -> anyhow::Result<()> {
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

pub(crate) fn out(line: &str) -> std::io::Result<()> {
  let mut stdout = std::io::stdout().lock();
  writeln!(stdout, "{line}")
}
