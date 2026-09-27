//! Generic ops — product features stay on the Worker.

pub mod cancel;
pub mod registry;
pub mod run;
pub mod update;

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
) -> anyhow::Result<()> {
  match env.op {
    Op::Run => run::handle(&env, out, runs, run_slots).await,
    Op::Cancel => cancel::handle(&env, out, runs).await,
    Op::Update => update::handle(&env, out).await,
    Op::Config => {
      if let Some(body) = &env.body
        && let Some(v) = body.get("autoUpdate").and_then(|x| x.as_bool())
      {
        settings::set_auto_update(v)?;
      }
      let _ = out
        .send(Envelope {
          v: PROTO_V,
          id: env.id.clone(),
          op: Op::Result,
          body: Some(serde_json::json!({
            "ok": true,
            "autoUpdate": settings::auto_update_enabled(),
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
    Op::AgentHealth | Op::Result | Op::Error | Op::Event => {
      anyhow::bail!("op {:?} is not an inbound control op", env.op)
    }
  }
}
