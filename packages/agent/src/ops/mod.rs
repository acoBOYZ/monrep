//! Generic ops — product features stay on the Worker.

pub mod cancel;
pub mod metrics;
pub mod pty;
pub mod registry;
pub mod run;
pub mod update;

use crate::metrics::MetricsDb;
use crate::ops::pty::PtyMap;
use crate::ops::registry::RunRegistry;
use crate::proto::{Envelope, Op, PROTO_V};
use crate::settings;
use std::sync::Arc;
use tokio::sync::{Semaphore, mpsc};

pub async fn handle(
  env: Envelope,
  out: mpsc::Sender<Envelope>,
  runs: RunRegistry,
  run_slots: Arc<Semaphore>,
  ptys: PtyMap,
  pty_slots: Arc<Semaphore>,
  metrics_db: Arc<MetricsDb>,
) -> anyhow::Result<()> {
  match env.op {
    Op::Run => run::handle(&env, out, runs, run_slots).await,
    Op::Cancel => cancel::handle(&env, out, runs).await,
    Op::Update => update::handle(&env, out).await,
    Op::PtyOpen => pty::handle_open(&env, out, ptys, pty_slots).await,
    Op::PtyData => pty::handle_data(&env, ptys).await,
    Op::PtyResize => pty::handle_resize(&env, ptys).await,
    Op::PtyClose => pty::handle_close(&env, ptys).await,
    Op::MetricsQuery | Op::MetricsLatest | Op::MetricsNames | Op::EventsQuery => {
      metrics::handle(&env, out, metrics_db).await
    }
    Op::Config => {
      if let Some(body) = &env.body {
        if let Some(v) = body.get("autoUpdate").and_then(|x| x.as_bool()) {
          settings::set_auto_update(v)?;
        }
        let metrics_enabled = body.get("metricsEnabled").and_then(|x| x.as_bool());
        let metrics_interval = body
          .get("metricsIntervalSec")
          .and_then(|x| x.as_u64())
          .or_else(|| {
            body
              .get("metricsIntervalSec")
              .and_then(|x| x.as_i64())
              .map(|i| i as u64)
          });
        if metrics_enabled.is_some() || metrics_interval.is_some() {
          settings::apply_metrics_config(metrics_enabled, metrics_interval)?;
        }
      }
      let s = settings::load_settings().unwrap_or_default();
      let _ = out
        .send(Envelope {
          v: PROTO_V,
          id: env.id.clone(),
          op: Op::Result,
          body: Some(serde_json::json!({
            "ok": true,
            "autoUpdate": s.auto_update,
            "metricsEnabled": s.metrics_enabled,
            "metricsIntervalSec": s.metrics_interval_sec,
          })),
        })
        .await;
      Ok(())
    }
    Op::Hello | Op::Heartbeat => {
      let _ = out
        .send(Envelope {
          v: PROTO_V,
          id: env.id.clone(),
          op: Op::Result,
          body: Some(serde_json::json!({ "ok": true })),
        })
        .await;
      Ok(())
    }
    // Agent→CP (or stray CP ACKs). Never control; ignore so we do not Error-storm.
    Op::AgentHealth | Op::Result | Op::Error | Op::Event => Ok(()),
  }
}
