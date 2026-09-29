//! Never-exit wrapper: reconnect tunnel; PTYs/runs live on Runtime.

use crate::error::AgentError;
use crate::health::HealthBus;
use crate::proto::HealthLevel;
use crate::runtime::Runtime;
use crate::store::{self, DeviceCred};
use crate::tunnel;
use std::time::Duration;
use tokio::signal;
use tokio::time::sleep;

/// Fixed delay between tunnel reconnects (no exponential theater).
const RECONNECT_DELAY: Duration = Duration::from_secs(1);

/// Run until Ctrl-C or permanent unenroll (`DeviceUnknown`). Survives transient tunnel errors.
pub async fn run_forever() -> anyhow::Result<()> {
  let mut runtime = Runtime::new()?;
  let mut health = HealthBus::new();
  health.set_metrics_db(runtime.metrics_db.clone());
  health.emit(HealthLevel::Info, "supervisor_start", "supervisor started");

  loop {
    tokio::select! {
      _ = signal::ctrl_c() => {
        health.emit(HealthLevel::Info, "supervisor_stop", "ctrl-c received");
        let pending = health.drain();
        print_health(&health);
        let _ = writeln_stdout(&format!("flushed {} buffered health event(s)", pending.len()));
        return Ok(());
      }
      result = supervised_session(&mut health, &mut runtime) => {
        match result {
          Ok(true) => {
            health.emit(
              HealthLevel::Warn,
              "tunnel_reconnect",
              format!("reconnect in {}s", RECONNECT_DELAY.as_secs()),
            );
            print_health(&health);
            tokio::select! {
              _ = signal::ctrl_c() => {
                health.emit(HealthLevel::Info, "supervisor_stop", "ctrl-c received");
                return Ok(());
              }
              _ = sleep(RECONNECT_DELAY) => {}
            }
          }
          Ok(false) => {
            // DeviceUnknown cleared local creds — leave enrollable, do not retry.
            return Ok(());
          }
          Err(e) => {
            // Credential store hard failure — brief pause then retry.
            health.emit(HealthLevel::Error, "supervisor_error", format!("{e:#}"));
            print_health(&health);
            tokio::select! {
              _ = signal::ctrl_c() => return Ok(()),
              _ = sleep(RECONNECT_DELAY) => {}
            }
          }
        }
      }
    }
  }
}

/// `Ok(true)` = tunnel ended, retry; `Ok(false)` = permanent stop (unenrolled).
async fn supervised_session(health: &mut HealthBus, runtime: &mut Runtime) -> anyhow::Result<bool> {
  let cred = match load_cred_resilient(health) {
    Some(c) => c,
    None => anyhow::bail!("credential store unavailable"),
  };

  health.emit(
    HealthLevel::Info,
    "tunnel_connect",
    format!("dialing {}", cred.control_url),
  );
  print_health(health);

  match tunnel::run_session(&cred, health, runtime).await {
    Ok(()) => Ok(true),
    Err(AgentError::DeviceUnknown) => {
      match store::clear() {
        Ok(true) => {
          let _ = writeln_stdout("run: cleared stale credentials (device unknown/revoked)");
        }
        Ok(false) => {}
        Err(e) => {
          health.emit(
            HealthLevel::Error,
            "store_error",
            format!("failed to clear credentials: {e}"),
          );
          print_health(health);
        }
      }
      health.emit(
        HealthLevel::Error,
        "not_enrolled",
        "device unknown or revoked; credentials cleared — run monrep link again",
      );
      print_health(health);
      Ok(false)
    }
    Err(e) => {
      health.emit(HealthLevel::Warn, "tunnel_error", format!("{e:#}"));
      print_health(health);
      Ok(true)
    }
  }
}

fn load_cred_resilient(health: &mut HealthBus) -> Option<DeviceCred> {
  match store::load() {
    Ok(c) => Some(c),
    Err(e) => {
      health.emit(HealthLevel::Error, "store_error", format!("{e}"));
      None
    }
  }
}

fn print_health(health: &HealthBus) {
  if let Some(last) = health.last() {
    let _ = writeln_stdout(&format!(
      "health[{}] {}: {} (pending={})",
      last.level_str(),
      last.code,
      last.message,
      health.pending_len()
    ));
  }
}

trait LevelStr {
  fn level_str(&self) -> &'static str;
}

impl LevelStr for crate::proto::HealthBody {
  fn level_str(&self) -> &'static str {
    match self.level {
      HealthLevel::Info => "info",
      HealthLevel::Warn => "warn",
      HealthLevel::Error => "error",
    }
  }
}

fn writeln_stdout(line: &str) -> std::io::Result<()> {
  use std::io::Write;
  let mut out = std::io::stdout().lock();
  writeln!(out, "{line}")
}
