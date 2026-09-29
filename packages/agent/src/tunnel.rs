//! Outbound WSS tunnel to the pinned control plane only.
//! Transport only — PTYs/runs live on [`crate::runtime::Runtime`].

use crate::dispatch;
use crate::error::{AgentError, Result};
use crate::health::HealthBus;
use crate::http;
use crate::proto::{Envelope, HelloBody, Op, PROTO_V};
use crate::runtime::Runtime;
use crate::store::{self, DeviceCred};
use crate::tls;
use futures_util::stream::{SplitSink, SplitStream};
use futures_util::{SinkExt, StreamExt};
use std::time::Duration;
use tokio::net::TcpStream;
use tokio::time::{Interval, MissedTickBehavior, interval, timeout};
use tokio_tungstenite::{
  MaybeTlsStream, WebSocketStream,
  tungstenite::{
    Message,
    client::IntoClientRequest,
    http::{HeaderValue, header},
  },
};

const WSS_CONNECT_TIMEOUT: Duration = Duration::from_secs(30);

type WsStream = WebSocketStream<MaybeTlsStream<TcpStream>>;
type WsWrite = SplitSink<WsStream, Message>;
type WsRead = SplitStream<WsStream>;

struct Tunnel {
  write: WsWrite,
  read: WsRead,
  heartbeat: Interval,
  hb_n: u64,
  auto_update_on: bool,
  update_tick: Interval,
}

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

/// Dial control plane and run until disconnect / error. Does not own PTYs.
pub async fn run_session(
  cred: &DeviceCred,
  health: &mut HealthBus,
  runtime: &mut Runtime,
) -> Result<()> {
  let mut tunnel = open_tunnel(cred, health, runtime).await?;
  session_loop(&mut tunnel, health, runtime).await
}

async fn open_tunnel(
  cred: &DeviceCred,
  health: &mut HealthBus,
  runtime: &mut Runtime,
) -> Result<Tunnel> {
  store::assert_pinned_url(cred, &cred.control_url)?;
  let ws_url = to_ws_url(&cred.control_url).map_err(AgentError::Other)?;

  health.emit(
    crate::proto::HealthLevel::Info,
    "token_refresh",
    format!(
      "POST {}/api/agent/token",
      cred.control_url.trim_end_matches('/')
    ),
  );
  let access = match http::refresh_access(cred).await {
    Ok(token) => token,
    Err(AgentError::DeviceUnknown) => return Err(AgentError::DeviceUnknown),
    Err(e) => {
      return Err(AgentError::Other(anyhow::anyhow!(
        "token refresh failed: {e:#}"
      )));
    }
  };

  health.emit(
    crate::proto::HealthLevel::Info,
    "wss_connect",
    format!("dialing {ws_url}"),
  );
  let mut request = ws_url
    .into_client_request()
    .map_err(|e| AgentError::Other(anyhow::anyhow!(e)))?;
  let bearer = format!("Bearer {access}");
  request.headers_mut().insert(
    header::AUTHORIZATION,
    HeaderValue::from_str(&bearer).map_err(|e| AgentError::Other(anyhow::anyhow!(e)))?,
  );
  let ws = timeout(WSS_CONNECT_TIMEOUT, tls::connect_ws(request))
    .await
    .map_err(|_| AgentError::Other(anyhow::anyhow!("wss connect timed out after 30s")))?
    .map_err(|e| AgentError::Other(anyhow::anyhow!("wss connect: {e}")))?;
  let (write, read) = ws.split();

  health.emit(
    crate::proto::HealthLevel::Info,
    "wss_connected",
    "tunnel up",
  );

  for env in health.drain() {
    if runtime.out_tx.send(env).await.is_err() {
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
  if runtime.out_tx.send(hello).await.is_err() {
    return Err(AgentError::Other(anyhow::anyhow!("out queue closed")));
  }

  let mut heartbeat = interval(Duration::from_secs(20));
  heartbeat.set_missed_tick_behavior(MissedTickBehavior::Delay);
  let mut update_tick = interval(Duration::from_secs(
    crate::update::AUTO_UPDATE_INTERVAL_SECS,
  ));
  update_tick.set_missed_tick_behavior(MissedTickBehavior::Delay);

  Ok(Tunnel {
    write,
    read,
    heartbeat,
    hb_n: 0,
    auto_update_on: crate::settings::auto_update_enabled(),
    update_tick,
  })
}

async fn session_loop(
  tunnel: &mut Tunnel,
  health: &mut HealthBus,
  runtime: &mut Runtime,
) -> Result<()> {
  loop {
    let auto_update_on = tunnel.auto_update_on;
    tokio::select! {
      msg = tunnel.read.next() => {
        handle_read(tunnel, health, runtime, msg).await?;
      }
      Some(env) = runtime.out_rx.recv() => {
        send_text(&mut tunnel.write, &env).await?;
      }
      _ = tunnel.heartbeat.tick() => {
        tunnel.hb_n += 1;
        let env = Envelope {
          v: PROTO_V,
          id: format!("hb-{}", tunnel.hb_n),
          op: Op::Heartbeat,
          body: Some(serde_json::json!({ "n": tunnel.hb_n })),
        };
        send_text(&mut tunnel.write, &env).await?;
      }
      _ = tunnel.update_tick.tick(), if auto_update_on => {
        try_auto_update(tunnel, health, runtime).await?;
      }
    }
  }
}

async fn handle_read(
  tunnel: &mut Tunnel,
  health: &mut HealthBus,
  runtime: &Runtime,
  msg: Option<std::result::Result<Message, tokio_tungstenite::tungstenite::Error>>,
) -> Result<()> {
  match msg {
    Some(Ok(Message::Text(text))) => {
      match serde_json::from_str::<Envelope>(&text) {
        Ok(env) => {
          let tx = runtime.out_tx.clone();
          let runs = runtime.runs.clone();
          let run_slots = runtime.run_slots.clone();
          let ptys = runtime.ptys.clone();
          let pty_slots = runtime.pty_slots.clone();
          let metrics_db = runtime.metrics_db.clone();
          tokio::spawn(async move {
            let tx_err = tx.clone();
            let req_id = env.id.clone();
            let work = tokio::spawn(async move {
              dispatch::dispatch(env, tx, runs, run_slots, ptys, pty_slots, metrics_db).await
            });
            match work.await {
              Ok(Ok(())) => {}
              Ok(Err(e)) => {
                let _ = tx_err
                  .send(Envelope {
                    v: PROTO_V,
                    id: req_id,
                    op: Op::Error,
                    body: Some(serde_json::json!({ "message": format!("{e:#}") })),
                  })
                  .await;
              }
              Err(e) if e.is_panic() => {
                let _ = tx_err
                  .send(Envelope {
                    v: PROTO_V,
                    id: req_id,
                    op: Op::Error,
                    body: Some(serde_json::json!({ "message": "dispatch panicked" })),
                  })
                  .await;
              }
              Err(e) => {
                let _ = tx_err
                  .send(Envelope {
                    v: PROTO_V,
                    id: req_id,
                    op: Op::Error,
                    body: Some(serde_json::json!({ "message": format!("dispatch join: {e}") })),
                  })
                  .await;
              }
            }
          });
        }
        Err(e) => {
          health.emit(crate::proto::HealthLevel::Warn, "bad_frame", format!("{e}"));
        }
      }
      Ok(())
    }
    Some(Ok(Message::Ping(p))) => {
      let _ = tunnel.write.send(Message::Pong(p)).await;
      Ok(())
    }
    Some(Ok(Message::Close(_))) | None => {
      Err(AgentError::Other(anyhow::anyhow!("websocket closed")))
    }
    Some(Ok(_)) => Ok(()),
    Some(Err(e)) => Err(AgentError::Other(anyhow::anyhow!("websocket read: {e}"))),
  }
}

async fn send_text(write: &mut WsWrite, env: &Envelope) -> Result<()> {
  let text = serde_json::to_string(env)?;
  write
    .send(Message::Text(text.into()))
    .await
    .map_err(|e| AgentError::Other(anyhow::anyhow!("websocket write: {e}")))
}

async fn try_auto_update(
  tunnel: &mut Tunnel,
  health: &mut HealthBus,
  runtime: &mut Runtime,
) -> Result<()> {
  match crate::update::check_for_update().await {
    Ok(Some(info)) => {
      health.emit(
        crate::proto::HealthLevel::Info,
        "auto_update",
        format!("checking {}", info.tag),
      );
      while let Ok(env) = runtime.out_rx.try_recv() {
        let _ = send_text(&mut tunnel.write, &env).await;
      }
      health.emit(
        crate::proto::HealthLevel::Info,
        "auto_update",
        format!("applying {}", info.tag),
      );
      let exe = crate::update::apply_update(&info).await?;
      crate::update::reexec_public(&exe)
    }
    Ok(None) => Ok(()),
    Err(e) => {
      health.emit(
        crate::proto::HealthLevel::Warn,
        "auto_update_check",
        format!("{e:#}"),
      );
      Ok(())
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn ws_url_https() {
    assert_eq!(
      to_ws_url("https://monrep.dev").unwrap(),
      "wss://monrep.dev/api/agent/ws"
    );
    assert_eq!(
      to_ws_url("https://monrep.dev/").unwrap(),
      "wss://monrep.dev/api/agent/ws"
    );
  }

  #[test]
  fn ws_url_http() {
    assert_eq!(
      to_ws_url("http://127.0.0.1:5274").unwrap(),
      "ws://127.0.0.1:5274/api/agent/ws"
    );
  }
}
