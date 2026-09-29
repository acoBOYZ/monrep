//! Wire protocol: versioned JSON envelopes (main ↔ agent).

use serde::{Deserialize, Serialize};

pub const PROTO_V: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Envelope {
  pub v: u32,
  pub id: String,
  pub op: Op,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub body: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Op {
  Hello,
  Heartbeat,
  Run,
  Cancel,
  /// Self-update from GitHub Releases (control plane → agent).
  Update,
  /// Push agent settings (e.g. autoUpdate).
  Config,
  #[serde(rename = "agent.health")]
  AgentHealth,
  #[serde(rename = "pty.open")]
  PtyOpen,
  #[serde(rename = "pty.data")]
  PtyData,
  #[serde(rename = "pty.resize")]
  PtyResize,
  #[serde(rename = "pty.close")]
  PtyClose,
  #[serde(rename = "metrics.query")]
  MetricsQuery,
  #[serde(rename = "metrics.latest")]
  MetricsLatest,
  #[serde(rename = "metrics.names")]
  MetricsNames,
  #[serde(rename = "events.query")]
  EventsQuery,
  Result,
  Error,
  Event,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HelloBody {
  pub device_id: String,
  pub agent_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunBody {
  pub argv: Vec<String>,
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub cwd: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CancelBody {
  pub run_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthBody {
  pub level: HealthLevel,
  pub code: String,
  pub message: String,
  pub at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum HealthLevel {
  Info,
  Warn,
  Error,
}

impl Envelope {
  pub fn new(id: impl Into<String>, op: Op, body: impl Serialize) -> anyhow::Result<Self> {
    Ok(Self {
      v: PROTO_V,
      id: id.into(),
      op,
      body: Some(serde_json::to_value(body)?),
    })
  }
}
