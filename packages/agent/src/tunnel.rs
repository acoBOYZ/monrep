//! Outbound WSS tunnel to the pinned control plane only.

use crate::dispatch;
use crate::error::{AgentError, Result};
use crate::health::HealthBus;
use crate::http;
use crate::ops::registry::{self, RunRegistry};
use crate::ops::run::MAX_RUNS;
use crate::proto::{Envelope, HelloBody, Op, PROTO_V};
use crate::store::{self, DeviceCred};
use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{Semaphore, mpsc};
use tokio::time::{MissedTickBehavior, interval};
use tokio_tungstenite::{
  connect_async,
  tungstenite::{
    Message,
    client::IntoClientRequest,
    http::{HeaderValue, header},
  },
};

const OUT_QUEUE: usize = 64;

/// Map HTTPS control URL → WSS endpoint path.
pub fn to_ws_url(control_url: &str) -> anyhow::Result<String> {
  let base = control_url.trim().trim_end_matches('/');
  let ws = if let Some(rest) = base.strip_prefix("https://") {
    format!("wss://{rest}/api/agent/ws")
  } else if let Some(rest) = base.strip_prefix("http://") {
    format!("ws://{rest}/api/agent/ws")
  } else if base.starts_with("wss://") || base.starts_with("ws://") {
    format!("{base}/api/agent/ws")
  } else {
    anyhow::bail!("control_url must be http(s) or ws(s): {control_url}");
  };
  Ok(ws)
}

/// Dial control plane and run until disconnect / error.
pub async fn run_session(cred: &DeviceCred, health: &mut HealthBus) -> Result<()> {
  store::assert_pinned_url(cred, &cred.control_url)?;
  let ws_url = to_ws_url(&cred.control_url).map_err(AgentError::Other)?;
  let access = http::refresh_access(cred)
    .await
    .map_err(AgentError::Other)?;

  let mut request = ws_url
    .into_client_request()
    .map_err(|e| AgentError::Other(anyhow::anyhow!(e)))?;
  let bearer = format!("Bearer {access}");
  request.headers_mut().insert(
    header::AUTHORIZATION,
    HeaderValue::from_str(&bearer).map_err(|e| AgentError::Other(anyhow::anyhow!(e)))?,
  );

  let (ws, _) = connect_async(request)
    .await
    .map_err(|e| AgentError::Other(anyhow::anyhow!("wss connect: {e}")))?;
  let (mut write, mut read) = ws.split();

  let (out_tx, mut out_rx) = mpsc::channel::<Envelope>(OUT_QUEUE);
  let runs: RunRegistry = registry::new_registry();
  let run_slots = Arc::new(Semaphore::new(MAX_RUNS));

  // Flush buffered health on connect.
  for env in health.drain() {
    if out_tx.send(env).await.is_err() {
      return Err(AgentError::Other(anyhow::anyhow!("out queue closed")));
    }
  }

  let hello = Envelope::new(
    format!("hello-{}", cred.device_id),
    Op::Hello,
    HelloBody {
      device_id: cred.device_id.clone(),
      agent_version: env!("CARGO_PKG_VERSION").into(),
    },
  )
  .map_err(AgentError::Other)?;
  if out_tx.send(hello).await.is_err() {
    return Err(AgentError::Other(anyhow::anyhow!("out queue closed")));
  }

  let mut heartbeat = interval(Duration::from_secs(20));
  heartbeat.set_missed_tick_behavior(MissedTickBehavior::Delay);
  let mut hb_n: u64 = 0;

  let auto_update_on = crate::settings::auto_update_enabled();
  let mut update_tick = interval(Duration::from_secs(
    crate::update::AUTO_UPDATE_INTERVAL_SECS,
  ));
  update_tick.set_missed_tick_behavior(MissedTickBehavior::Delay);
  // First tick is immediate — covers "shortly after connect".

  loop {
    tokio::select! {
      msg = read.next() => {
        match msg {
          Some(Ok(Message::Text(text))) => {
            match serde_json::from_str::<Envelope>(&text) {
              Ok(env) => {
                let tx = out_tx.clone();
                let runs = runs.clone();
                let run_slots = run_slots.clone();
                tokio::spawn(async move {
                  if let Err(e) = dispatch::dispatch(env.clone(), tx.clone(), runs, run_slots).await {
                    let _ = tx.send(Envelope {
                      v: PROTO_V,
                      id: env.id,
                      op: Op::Error,
                      body: Some(serde_json::json!({ "message": format!("{e:#}") })),
                    }).await;
                  }
                });
              }
              Err(e) => {
                health.emit(crate::proto::HealthLevel::Warn, "bad_frame", format!("{e}"));
              }
            }
          }
          Some(Ok(Message::Ping(p))) => {
            let _ = write.send(Message::Pong(p)).await;
          }
          Some(Ok(Message::Close(_))) | None => {
            return Err(AgentError::Other(anyhow::anyhow!("websocket closed")));
          }
          Some(Ok(_)) => {}
          Some(Err(e)) => {
            return Err(AgentError::Other(anyhow::anyhow!("websocket read: {e}")));
          }
        }
      }
      Some(env) = out_rx.recv() => {
        let text = serde_json::to_string(&env)?;
        write
          .send(Message::Text(text.into()))
          .await
          .map_err(|e| AgentError::Other(anyhow::anyhow!("websocket write: {e}")))?;
      }
      _ = heartbeat.tick() => {
        hb_n += 1;
        let env = Envelope {
          v: PROTO_V,
          id: format!("hb-{hb_n}"),
          op: Op::Heartbeat,
          body: Some(serde_json::json!({ "n": hb_n })),
        };
        let text = serde_json::to_string(&env)?;
        write
          .send(Message::Text(text.into()))
          .await
          .map_err(|e| AgentError::Other(anyhow::anyhow!("websocket heartbeat: {e}")))?;
      }
      _ = update_tick.tick(), if auto_update_on => {
        match crate::update::check_for_update().await {
          Ok(Some(info)) => {
            health.emit(
              crate::proto::HealthLevel::Info,
              "auto_update",
              format!("applying {}", info.tag),
            );
            while let Ok(env) = out_rx.try_recv() {
              let text = serde_json::to_string(&env)?;
              let _ = write.send(Message::Text(text.into())).await;
            }
            let exe = crate::update::apply_update(&info).await?;
            return crate::update::reexec_public(&exe);
          }
          Ok(None) => {}
          Err(e) => {
            health.emit(
              crate::proto::HealthLevel::Warn,
              "auto_update_check",
              format!("{e:#}"),
            );
          }
        }
      }
    }
  }
}
