//! Never-exit wrapper: reconnect tunnel; PTYs/runs live on Runtime.

use crate::error::AgentError;
use crate::health::HealthBus;
use crate::proto::HealthLevel;
use crate::runtime::Runtime;
use crate::store::{self, DeviceCred};
use crate::tunnel;
use std::io::{self, Write};
use std::time::{Duration, Instant};
use tokio::signal;
use tokio::time::sleep;

const RECONNECT_BASE_SECS: u64 = 1;
const RECONNECT_CAP_SECS: u64 = 60;
/// Drop identical health lines more often than this while still retrying.
const HEALTH_LOG_MIN_INTERVAL: Duration = Duration::from_secs(30);

/// Run until Ctrl-C or permanent unenroll (`DeviceUnknown`). Survives transient tunnel errors.
pub async fn run_forever() -> anyhow::Result<()> {
  let mut runtime = Runtime::new()?;
  let mut health = HealthBus::new();
  health.set_metrics_db(runtime.metrics_db.clone());
  health.emit(HealthLevel::Info, "supervisor_start", "supervisor started");
  print_health(&health);

  let mut backoff_secs = RECONNECT_BASE_SECS;
  let mut last_health_line: Option<(String, Instant)> = None;

  loop {
    tokio::select! {
      _ = signal::ctrl_c() => {
        health.emit(HealthLevel::Info, "supervisor_stop", "ctrl-c received");
        let pending = health.drain();
        print_health_rate_limited(&health, &mut last_health_line);
        let _ = writeln_stdout_nonblock(&format!(
          "flushed {} buffered health event(s)",
          pending.len()
        ));
        return Ok(());
      }
      result = supervised_session(&mut health, &mut runtime, &mut last_health_line) => {
        match result {
          Ok(SessionOutcome::Retry { reset_backoff }) => {
            if reset_backoff {
              backoff_secs = RECONNECT_BASE_SECS;
            } else if backoff_secs < RECONNECT_CAP_SECS {
              let next = (backoff_secs.saturating_mul(2)).min(RECONNECT_CAP_SECS);
              if next != backoff_secs {
                backoff_secs = next;
                let _ = writeln_stdout_nonblock(&format!(
                  "run: reconnect backoff now {backoff_secs}s"
                ));
              }
            }
            health.emit(
              HealthLevel::Warn,
              "tunnel_reconnect",
              format!("reconnect in {backoff_secs}s"),
            );
            print_health_rate_limited(&health, &mut last_health_line);
            let delay = Duration::from_secs(backoff_secs);
            tokio::select! {
              _ = signal::ctrl_c() => {
                health.emit(HealthLevel::Info, "supervisor_stop", "ctrl-c received");
                return Ok(());
              }
              _ = sleep(delay) => {}
            }
          }
          Ok(SessionOutcome::Stop) => {
            // DeviceUnknown cleared local creds — leave enrollable, do not retry.
            return Ok(());
          }
          Err(e) => {
            // Credential store hard failure — brief pause then retry with backoff.
            if backoff_secs < RECONNECT_CAP_SECS {
              backoff_secs = (backoff_secs.saturating_mul(2)).min(RECONNECT_CAP_SECS);
            }
            health.emit(HealthLevel::Error, "supervisor_error", format!("{e:#}"));
            print_health_rate_limited(&health, &mut last_health_line);
            let delay = Duration::from_secs(backoff_secs);
            tokio::select! {
              _ = signal::ctrl_c() => return Ok(()),
              _ = sleep(delay) => {}
            }
          }
        }
      }
    }
  }
}

enum SessionOutcome {
  /// Retry after delay. `reset_backoff` when the tunnel was up (clean end).
  Retry {
    reset_backoff: bool,
  },
  Stop,
}

/// `Ok(Retry)` = tunnel ended or failed transiently; `Ok(Stop)` = permanent unenroll.
async fn supervised_session(
  health: &mut HealthBus,
  runtime: &mut Runtime,
  last_health_line: &mut Option<(String, Instant)>,
) -> anyhow::Result<SessionOutcome> {
  let cred = match load_cred_resilient(health) {
    Some(c) => c,
    None => anyhow::bail!("credential store unavailable"),
  };

  health.emit(
    HealthLevel::Info,
    "tunnel_connect",
    format!("dialing {}", cred.control_url),
  );
  print_health_rate_limited(health, last_health_line);

  match tunnel::run_session(&cred, health, runtime).await {
    Ok(()) => Ok(SessionOutcome::Retry {
      reset_backoff: true,
    }),
    Err(AgentError::DeviceUnknown) => {
      match store::clear() {
        Ok(true) => {
          let _ =
            writeln_stdout_nonblock("run: cleared stale credentials (device unknown/revoked)");
        }
        Ok(false) => {}
        Err(e) => {
          health.emit(
            HealthLevel::Error,
            "store_error",
            format!("failed to clear credentials: {e}"),
          );
          print_health_rate_limited(health, last_health_line);
        }
      }
      health.emit(
        HealthLevel::Error,
        "not_enrolled",
        "device unknown or revoked; credentials cleared — run monrep link again",
      );
      print_health_rate_limited(health, last_health_line);
      Ok(SessionOutcome::Stop)
    }
    Err(e) => {
      health.emit(HealthLevel::Warn, "tunnel_error", format!("{e:#}"));
      print_health_rate_limited(health, last_health_line);
      Ok(SessionOutcome::Retry {
        reset_backoff: false,
      })
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
    let _ = writeln_stdout_nonblock(&format!(
      "health[{}] {}: {} (pending={})",
      last.level_str(),
      last.code,
      last.message,
      health.pending_len()
    ));
  }
}

fn print_health_rate_limited(health: &HealthBus, last: &mut Option<(String, Instant)>) {
  let Some(body) = health.last() else {
    return;
  };
  let line = format!(
    "health[{}] {}: {} (pending={})",
    body.level_str(),
    body.code,
    body.message,
    health.pending_len()
  );
  let now = Instant::now();
  if let Some((prev, at)) = last.as_ref()
    && prev == &line
    && now.duration_since(*at) < HEALTH_LOG_MIN_INTERVAL
  {
    return;
  }
  if writeln_stdout_nonblock(&line).is_ok() {
    *last = Some((line, now));
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

/// Best-effort stdout; never block the reconnect loop on a full journal pipe.
fn writeln_stdout_nonblock(line: &str) -> io::Result<()> {
  ensure_stdout_nonblock();
  let mut out = io::stdout().lock();
  match out.write_all(line.as_bytes()) {
    Ok(()) => {}
    Err(e) if e.kind() == io::ErrorKind::WouldBlock => return Ok(()),
    Err(e) => return Err(e),
  }
  match out.write_all(b"\n") {
    Ok(()) => {}
    Err(e) if e.kind() == io::ErrorKind::WouldBlock => return Ok(()),
    Err(e) => return Err(e),
  }
  match out.flush() {
    Ok(()) => Ok(()),
    Err(e) if e.kind() == io::ErrorKind::WouldBlock => Ok(()),
    Err(e) => Err(e),
  }
}

fn ensure_stdout_nonblock() {
  use std::sync::Once;
  static ONCE: Once = Once::new();
  ONCE.call_once(|| {
    #[cfg(unix)]
    {
      use std::os::fd::AsRawFd;
      let fd = io::stdout().as_raw_fd();
      // SAFETY: fcntl F_GETFL / F_SETFL on our stdout fd only.
      let flags = unsafe { libc::fcntl(fd, libc::F_GETFL) };
      if flags >= 0 {
        unsafe {
          libc::fcntl(fd, libc::F_SETFL, flags | libc::O_NONBLOCK);
        }
      }
    }
  });
}
