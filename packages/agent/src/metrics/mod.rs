//! Local metrics SQLite — timeseries + events, 30d retention.

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

const RETENTION_MS: i64 = 30 * 24 * 60 * 60 * 1000;
const PRUNE_EVERY: Duration = Duration::from_secs(60 * 60);

pub fn open_default() -> Result<MetricsDb> {
  let path = config::metrics_db_path().map_err(AgentError::Other)?;
  MetricsDb::open(&path)
}

/// Background scrape + prune. Survives tunnel reconnects (spawn once from supervisor).
pub fn spawn_loop(db: Arc<MetricsDb>) {
  tokio::spawn(async move {
    let mut prune_iv = interval(PRUNE_EVERY);
    prune_iv.set_missed_tick_behavior(MissedTickBehavior::Delay);
    prune_iv.tick().await;

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
        _ = prune_iv.tick() => {
          let cutoff = now_ms() - RETENTION_MS;
          let _ = db.prune_before(cutoff);
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
