//! Local metrics SQLite — timeseries + events, tiered 30d retention.

mod db;
mod scrape;

pub use db::{MetricsDb, QueryAgg, QueryParams};
pub use scrape::scrape_host;

use crate::config;
use crate::error::{AgentError, Result};
use crate::settings;
use std::sync::Arc;
use std::time::Duration;
use tokio::time::{Instant, MissedTickBehavior, interval, sleep_until};

const MAINTAIN_EVERY: Duration = Duration::from_secs(60 * 60);

pub fn open_default() -> Result<MetricsDb> {
  let path = config::metrics_db_path().map_err(AgentError::Other)?;
  MetricsDb::open(&path)
}

/// Background scrape + maintain (prune / downsample / vacuum). Survives tunnel reconnects.
pub fn spawn_loop(db: Arc<MetricsDb>) {
  tokio::spawn(async move {
    let mut maintain_iv = interval(MAINTAIN_EVERY);
    maintain_iv.set_missed_tick_behavior(MissedTickBehavior::Delay);
    maintain_iv.tick().await;
    let _ = db.maintain(now_ms());

    let mut next_scrape =
      Instant::now() + Duration::from_secs(settings::metrics_interval_sec().max(5));

    loop {
      tokio::select! {
        _ = sleep_until(next_scrape) => {
          if settings::metrics_enabled() {
            let points = scrape_host();
            let _ = db.insert_metrics(&points);
          }
          next_scrape = Instant::now()
            + Duration::from_secs(settings::metrics_interval_sec().max(5));
        }
        _ = maintain_iv.tick() => {
          let _ = db.maintain(now_ms());
        }
      }
    }
  });
}

pub fn now_ms() -> i64 {
  std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)
    .map(|d| d.as_millis() as i64)
    .unwrap_or(0)
}

/// Persist a health/event row locally (not CF).
pub fn record_event(db: &MetricsDb, kind: &str, payload: serde_json::Value) {
  let _ = db.insert_event(now_ms(), kind, &payload.to_string());
}
