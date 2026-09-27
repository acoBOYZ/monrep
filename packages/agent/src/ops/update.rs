//! Handle inbound `update` op — self-update then re-exec.

use crate::proto::{Envelope, Op, PROTO_V};
use crate::update;
use tokio::sync::mpsc;

pub async fn handle(env: &Envelope, out: mpsc::Sender<Envelope>) -> anyhow::Result<()> {
  match update::check_for_update().await {
    Ok(None) => {
      let _ = out
        .send(Envelope {
          v: PROTO_V,
          id: env.id.clone(),
          op: Op::Result,
          body: Some(serde_json::json!({
            "ok": true,
            "updated": false,
            "version": env!("CARGO_PKG_VERSION"),
          })),
        })
        .await;
      Ok(())
    }
    Ok(Some(info)) => {
      let _ = out
        .send(Envelope {
          v: PROTO_V,
          id: env.id.clone(),
          op: Op::Result,
          body: Some(serde_json::json!({
            "ok": true,
            "updated": true,
            "version": info.version,
            "tag": info.tag,
          })),
        })
        .await;
      // Give the frame a moment to flush before re-exec.
      tokio::time::sleep(std::time::Duration::from_millis(200)).await;
      let exe = update::apply_update(&info).await?;
      Ok(update::reexec_public(&exe)?)
    }
    Err(e) => {
      let _ = out
        .send(Envelope {
          v: PROTO_V,
          id: env.id.clone(),
          op: Op::Error,
          body: Some(serde_json::json!({ "message": format!("{e:#}") })),
        })
        .await;
      Ok(())
    }
  }
}
