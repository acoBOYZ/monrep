//! Never-exit wrapper: backoff, restart runtime, emit health events.

use crate::error::AgentError;
use crate::health::HealthBus;
use crate::proto::HealthLevel;
use crate::store::{self, DeviceCred};
use crate::tunnel;
use std::time::Duration;
use tokio::signal;
use tokio::time::sleep;

const BACKOFF_START: Duration = Duration::from_secs(1);
const BACKOFF_MAX: Duration = Duration::from_secs(30);

/// Run until Ctrl-C or permanent unenroll (`DeviceUnknown`). Survives transient runtime errors.
pub async fn run_forever() -> anyhow::Result<()> {
  let mut health = HealthBus::new();
  health.emit(HealthLevel::Info, "supervisor_start", "supervisor started");

  let mut backoff = BACKOFF_START;

  loop {
    tokio::select! {
      _ = signal::ctrl_c() => {
        health.emit(HealthLevel::Info, "supervisor_stop", "ctrl-c received");
        let pending = health.drain();
        print_health(&health);
        let _ = writeln_stdout(&format!("flushed {} buffered health event(s)", pending.len()));
        return Ok(());
      }
      result = supervised_session(&mut health) => {
        match result {
          Ok(true) => {
            backoff = BACKOFF_START;
          }
          Ok(false) => {
            // DeviceUnknown cleared local creds — leave enrollable, do not retry.
            return Ok(());
          }
          Err(err) => {
            // supervised_session already emitted + printed runtime_error
            let _ = err;
            tokio::select! {
              _ = signal::ctrl_c() => {
                health.emit(HealthLevel::Info, "supervisor_stop", "ctrl-c received");
                let pending = health.drain();
                print_health(&health);
                let _ = writeln_stdout(&format!("flushed {} buffered health event(s)", pending.len()));
                return Ok(());
              }
              _ = sleep(backoff) => {
                backoff = (backoff * 2).min(BACKOFF_MAX);
                health.emit(
                  HealthLevel::Warn,
                  "runtime_restart",
                  format!("restarting after {}s backoff", backoff.as_secs()),
                );
                print_health(&health);
              }
            }
          }
        }
      }
    }
  }
}

/// `Ok(true)` = session ended cleanly / retry later; `Ok(false)` = permanent stop (unenrolled).
async fn supervised_session(health: &mut HealthBus) -> anyhow::Result<bool> {
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

  match tunnel::run_session(&cred, health).await {
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
      // Ensure the failure reason is in the health stream and stdout before backoff.
      health.emit(HealthLevel::Error, "runtime_error", format!("{e:#}"));
      print_health(health);
      Err(anyhow::anyhow!("{e:#}"))
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
