//! `cancel` op — stop an in-flight run by id.

use crate::ops::registry::RunRegistry;
use crate::proto::{CancelBody, Envelope, Op, PROTO_V};
use tokio::sync::mpsc;

pub async fn handle(
  env: &Envelope,
  out: mpsc::Sender<Envelope>,
  runs: RunRegistry,
) -> anyhow::Result<()> {
  let body: CancelBody = match &env.body {
    Some(v) => serde_json::from_value(v.clone())?,
    None => anyhow::bail!("cancel requires body"),
  };

  let killed = {
    let mut map = runs.lock().await;
    if let Some(mut child) = map.remove(&body.run_id) {
      let _ = child.kill().await;
      true
    } else {
      false
    }
  };

  let _ = out
    .send(Envelope {
      v: PROTO_V,
      id: env.id.clone(),
      op: Op::Result,
      body: Some(serde_json::json!({
        "ok": killed,
        "run_id": body.run_id,
        "cancelled": killed,
      })),
    })
    .await;
  Ok(())
}
