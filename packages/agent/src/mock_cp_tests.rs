//! Local mock control plane — token HTTP + WS hello/run without Cloudflare.

use crate::dispatch;
use crate::health::HealthBus;
use crate::http;
use crate::ops::registry::{self, RunRegistry};
use crate::ops::run::MAX_RUNS;
use crate::proto::{Envelope, HelloBody, Op, PROTO_V};
use crate::store::DeviceCred;
use crate::tunnel;
use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use std::time::Duration;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use tokio::sync::{Semaphore, mpsc, oneshot};
use tokio::time::timeout;
use tokio_tungstenite::{
  accept_async, connect_async,
  tungstenite::{
    Message,
    client::IntoClientRequest,
    http::{HeaderValue, header},
  },
};

async fn serve_mock(listener: TcpListener, mut shutdown: oneshot::Receiver<()>) {
  loop {
    tokio::select! {
      _ = &mut shutdown => break,
      accepted = listener.accept() => {
        let Ok((stream, _)) = accepted else { break };
        tokio::spawn(async move {
          if let Err(e) = handle_conn(stream).await {
            eprintln!("mock cp conn: {e:#}");
          }
        });
      }
    }
  }
}

async fn handle_conn(mut stream: tokio::net::TcpStream) -> anyhow::Result<()> {
  let mut peek = [0u8; 2048];
  let n = stream.peek(&mut peek).await?;
  let head = String::from_utf8_lossy(&peek[..n]);
  if head.starts_with("POST /api/agent/token") {
    let mut buf = vec![0u8; 4096];
    let _ = stream.read(&mut buf).await?;
    let body = serde_json::json!({
      "accessToken": "mock-access-token",
      "expiresAt": 9_999_999_999_i64,
    });
    let payload = body.to_string();
    let resp = format!(
      "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
      payload.len(),
      payload
    );
    stream.write_all(resp.as_bytes()).await?;
    return Ok(());
  }

  if head.contains("Upgrade: websocket") || head.contains("upgrade: websocket") {
    let mut ws = accept_async(stream).await?;
    let mut saw_hello = false;
    while let Some(msg) = ws.next().await {
      let msg = msg?;
      let Message::Text(text) = msg else {
        continue;
      };
      let env: Envelope = serde_json::from_str(&text)?;
      if env.op == Op::Hello {
        saw_hello = true;
        break;
      }
    }
    anyhow::ensure!(saw_hello, "expected hello from agent");

    let run = Envelope {
      v: PROTO_V,
      id: "run-1".into(),
      op: Op::Run,
      body: Some(serde_json::json!({
        "argv": ["true"],
      })),
    };
    ws.send(Message::Text(serde_json::to_string(&run)?.into()))
      .await?;

    let mut saw_result = false;
    let deadline = tokio::time::Instant::now() + Duration::from_secs(10);
    while tokio::time::Instant::now() < deadline {
      match timeout(Duration::from_secs(2), ws.next()).await {
        Ok(Some(Ok(Message::Text(text)))) => {
          let env: Envelope = serde_json::from_str(&text)?;
          if env.op == Op::Result && env.id == "run-1" {
            saw_result = true;
            break;
          }
        }
        Ok(Some(Ok(_))) => {}
        Ok(Some(Err(e))) => return Err(e.into()),
        Ok(None) => break,
        Err(_) => break,
      }
    }
    anyhow::ensure!(saw_result, "expected run result");
    let _ = ws.close(None).await;
    return Ok(());
  }

  anyhow::bail!("unexpected request:\n{head}");
}

async fn slim_session(cred: &DeviceCred, health: &mut HealthBus) -> anyhow::Result<()> {
  let ws_url = tunnel::to_ws_url(&cred.control_url)?;
  let access = http::refresh_access(cred).await?;
  let mut request = ws_url.into_client_request()?;
  request.headers_mut().insert(
    header::AUTHORIZATION,
    HeaderValue::from_str(&format!("Bearer {access}"))?,
  );
  let (ws, _) = connect_async(request).await?;
  let (mut write, mut read) = ws.split();

  let (out_tx, mut out_rx) = mpsc::channel::<Envelope>(32);
  let runs: RunRegistry = registry::new_registry();
  let run_slots = Arc::new(Semaphore::new(MAX_RUNS));
  let ptys = crate::ops::pty::new_pty_map();
  let pty_slots = Arc::new(Semaphore::new(crate::ops::pty::MAX_PTYS));
  let metrics_db = Arc::new(crate::metrics::MetricsDb::open(
    &std::env::temp_dir().join(format!("monrep-mock-metrics-{}.sqlite", std::process::id())),
  )?);

  let hello = Envelope::new(
    format!("hello-{}", cred.device_id),
    Op::Hello,
    HelloBody {
      device_id: cred.device_id.clone(),
      agent_version: env!("CARGO_PKG_VERSION").into(),
    },
  )?;
  out_tx.send(hello).await?;

  loop {
    tokio::select! {
      maybe = out_rx.recv() => {
        let Some(env) = maybe else { break };
        let text = serde_json::to_string(&env)?;
        write.send(Message::Text(text.into())).await?;
      }
      maybe = read.next() => {
        match maybe {
          None => break,
          Some(Ok(Message::Text(text))) => {
            match serde_json::from_str::<Envelope>(&text) {
              Ok(env) => {
                let tx = out_tx.clone();
                let runs = runs.clone();
                let run_slots = run_slots.clone();
                let ptys = ptys.clone();
                let pty_slots = pty_slots.clone();
                let metrics_db = metrics_db.clone();
                tokio::spawn(async move {
                  if let Err(e) = dispatch::dispatch(
                    env.clone(),
                    tx.clone(),
                    runs,
                    run_slots,
                    ptys,
                    pty_slots,
                    metrics_db,
                  )
                  .await
                  {
                    let _ = tx
                      .send(Envelope {
                        v: PROTO_V,
                        id: env.id,
                        op: Op::Error,
                        body: Some(serde_json::json!({ "message": format!("{e:#}") })),
                      })
                      .await;
                  }
                });
              }
              Err(e) => {
                health.emit(
                  crate::proto::HealthLevel::Warn,
                  "bad_frame",
                  format!("{e}"),
                );
              }
            }
          }
          Some(Ok(Message::Close(_))) => break,
          Some(Ok(_)) => {}
          Some(Err(e)) => return Err(e.into()),
        }
      }
    }
  }
  Ok(())
}

#[tokio::test]
async fn mock_token_and_session_hello_run() {
  let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
  let addr = listener.local_addr().unwrap();
  let (tx, rx) = oneshot::channel();
  let server = tokio::spawn(serve_mock(listener, rx));

  let control_url = format!("http://{addr}");
  let cred = DeviceCred {
    control_url: control_url.clone(),
    device_id: "dev-1".into(),
    token: "secret".into(),
  };

  let access = http::refresh_access(&cred).await.expect("token");
  assert_eq!(access, "mock-access-token");

  let ws_url = tunnel::to_ws_url(&control_url).unwrap();
  assert!(ws_url.starts_with("ws://"));

  let mut health = HealthBus::new();
  let outcome = timeout(Duration::from_secs(15), slim_session(&cred, &mut health)).await;

  let _ = tx.send(());
  let _ = server.await;

  outcome.expect("session timed out").expect("session failed");
}

#[test]
fn to_ws_url_maps_http() {
  assert_eq!(
    tunnel::to_ws_url("http://127.0.0.1:9").unwrap(),
    "ws://127.0.0.1:9/api/agent/ws"
  );
  assert_eq!(
    tunnel::to_ws_url("https://app.example/").unwrap(),
    "wss://app.example/api/agent/ws"
  );
}
