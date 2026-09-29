//! Health event bus — local SQLite events + small tunnel buffer.

use crate::metrics::{self, MetricsDb};
use crate::proto::{Envelope, HealthBody, HealthLevel, Op};
use std::collections::VecDeque;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

const MAX_BUFFER: usize = 64;

#[derive(Default)]
pub struct HealthBus {
  buffer: VecDeque<Envelope>,
  last: Option<HealthBody>,
  metrics_db: Option<Arc<MetricsDb>>,
}

impl HealthBus {
  pub fn new() -> Self {
    Self::default()
  }

  pub fn set_metrics_db(&mut self, db: Arc<MetricsDb>) {
    self.metrics_db = Some(db);
  }

  pub fn emit(&mut self, level: HealthLevel, code: impl Into<String>, message: impl Into<String>) {
    let body = HealthBody {
      level,
      code: code.into(),
      message: message.into(),
      at: now_rfc3339ish(),
    };
    self.last = Some(body.clone());
    if let Some(db) = &self.metrics_db {
      let level_str = match body.level {
        HealthLevel::Info => "info",
        HealthLevel::Warn => "warn",
        HealthLevel::Error => "error",
      };
      metrics::record_event(
        db,
        "health",
        serde_json::json!({
          "level": level_str,
          "code": body.code,
          "message": body.message,
        }),
      );
    }
    if let Ok(env) = Envelope::new(format!("health-{}", body.at), Op::AgentHealth, &body) {
      if self.buffer.len() >= MAX_BUFFER {
        self.buffer.pop_front();
      }
      self.buffer.push_back(env);
    }
  }

  pub fn last(&self) -> Option<&HealthBody> {
    self.last.as_ref()
  }

  /// Drain buffered health envelopes (legacy flush; CP no longer persists them).
  pub fn drain(&mut self) -> Vec<Envelope> {
    self.buffer.drain(..).collect()
  }

  pub fn pending_len(&self) -> usize {
    self.buffer.len()
  }
}

fn now_rfc3339ish() -> String {
  let secs = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map(|d| d.as_secs())
    .unwrap_or(0);
  format!("{secs}")
}
