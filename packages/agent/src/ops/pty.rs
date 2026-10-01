//! Dumb PTY byte pipe — open / data / resize / close. No product logic.

use crate::proto::{Envelope, Op, PROTO_V};
use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use portable_pty::{Child, CommandBuilder, MasterPty, NativePtySystem, PtySize, PtySystem};
use std::collections::{HashMap, HashSet};
use std::io::{Read, Write};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use tokio::sync::{Mutex, OwnedSemaphorePermit, Semaphore, mpsc, oneshot};
use tokio::time::timeout;

/// Max concurrent PTY sessions per agent process.
pub const MAX_PTYS: usize = 2;
const READ_CHUNK: usize = 32 * 1024;
const CLOSED_EARLY_CAP: usize = 64;

pub(crate) struct PtyRegistry {
  sessions: HashMap<String, PtySession>,
  closed_early: HashSet<String>,
}

impl PtyRegistry {
  fn new() -> Self {
    Self {
      sessions: HashMap::new(),
      closed_early: HashSet::new(),
    }
  }

  fn note_closed_early(&mut self, id: String) {
    if self.closed_early.len() >= CLOSED_EARLY_CAP {
      self.closed_early.clear();
    }
    self.closed_early.insert(id);
  }
}

struct PtySessionInner {
  master: Box<dyn MasterPty + Send>,
  writer: Box<dyn Write + Send>,
  child: Box<dyn Child + Send + Sync>,
}

pub(crate) struct PtySession {
  inner: Arc<std::sync::Mutex<PtySessionInner>>,
  close: oneshot::Sender<()>,
}

pub type PtyMap = Arc<Mutex<PtyRegistry>>;

pub fn new_pty_map() -> PtyMap {
  Arc::new(Mutex::new(PtyRegistry::new()))
}

pub async fn handle_open(
  env: &Envelope,
  out: mpsc::Sender<Envelope>,
  ptys: PtyMap,
  pty_slots: Arc<Semaphore>,
) -> anyhow::Result<()> {
  let cols = env
    .body
    .as_ref()
    .and_then(|b| b.get("cols"))
    .and_then(|v| v.as_u64())
    .unwrap_or(80) as u16;
  let rows = env
    .body
    .as_ref()
    .and_then(|b| b.get("rows"))
    .and_then(|v| v.as_u64())
    .unwrap_or(24) as u16;
  let shell = env
    .body
    .as_ref()
    .and_then(|b| b.get("shell"))
    .and_then(|v| v.as_str())
    .map(|s| s.to_string())
    .unwrap_or_else(default_shell);
  let req_id = env.id.clone();

  let permit = match acquire_pty_slot(ptys.clone(), pty_slots.clone()).await {
    Some(p) => p,
    None => {
      let _ = out
        .send(Envelope {
          v: PROTO_V,
          id: req_id.clone(),
          op: Op::Result,
          body: Some(serde_json::json!({
            "ok": false,
            "busy": true,
            "message": "pty busy",
            "pty_id": req_id,
          })),
        })
        .await;
      return Ok(());
    }
  };

  let pty_id = req_id.clone();
  let open_result =
    tokio::task::spawn_blocking(move || open_pty_blocking(cols, rows, &shell)).await;

  let (reader, master, writer, child) = match open_result {
    Ok(Ok(t)) => t,
    Ok(Err(e)) => {
      drop(permit);
      let _ = out
        .send(Envelope {
          v: PROTO_V,
          id: req_id.clone(),
          op: Op::Result,
          body: Some(serde_json::json!({
            "ok": false,
            "message": format!("{e:#}"),
            "pty_id": req_id,
          })),
        })
        .await;
      return Ok(());
    }
    Err(e) => {
      drop(permit);
      anyhow::bail!("pty open join: {e}");
    }
  };

  let (close_tx, close_rx) = oneshot::channel();
  let inner = Arc::new(std::sync::Mutex::new(PtySessionInner {
    master,
    writer,
    child,
  }));
  let session = PtySession {
    inner: inner.clone(),
    close: close_tx,
  };

  {
    let mut reg = ptys.lock().await;
    if reg.closed_early.remove(&pty_id) {
      drop(reg);
      drop(close_rx);
      return finish_open_closed_early(out, req_id, pty_id, permit, inner, reader).await;
    }
    reg.sessions.insert(pty_id.clone(), session);
  }

  let _ = out
    .send(Envelope {
      v: PROTO_V,
      id: req_id,
      op: Op::Result,
      body: Some(serde_json::json!({ "ok": true, "pty_id": pty_id })),
    })
    .await;

  spawn_pty_reader(reader, out, ptys, pty_id, permit, close_rx);
  Ok(())
}

async fn finish_open_closed_early(
  out: mpsc::Sender<Envelope>,
  req_id: String,
  pty_id: String,
  permit: OwnedSemaphorePermit,
  inner: Arc<std::sync::Mutex<PtySessionInner>>,
  reader: PtyReader,
) -> anyhow::Result<()> {
  drop(reader);
  tokio::task::spawn_blocking(move || terminate_pty_session(inner))
    .await
    .ok();
  drop(permit);
  let _ = out
    .send(Envelope {
      v: PROTO_V,
      id: req_id,
      op: Op::Result,
      body: Some(serde_json::json!({
        "ok": true,
        "pty_id": pty_id,
        "closed": true,
      })),
    })
    .await;
  Ok(())
}

fn spawn_pty_reader(
  reader: PtyReader,
  out: mpsc::Sender<Envelope>,
  ptys: PtyMap,
  pty_id: String,
  permit: OwnedSemaphorePermit,
  mut close_rx: oneshot::Receiver<()>,
) {
  let (reader_tx, mut reader_rx) = mpsc::channel::<Vec<u8>>(32);
  thread::spawn(move || {
    let mut reader = reader;
    let mut buf = vec![0_u8; READ_CHUNK];
    loop {
      match reader.read(&mut buf) {
        Ok(0) => break,
        Ok(n) => {
          if reader_tx.blocking_send(buf[..n].to_vec()).is_err() {
            break;
          }
        }
        Err(_) => break,
      }
    }
  });

  let out_panic = out.clone();
  let pty_id_panic = pty_id.clone();
  tokio::spawn(async move {
    let reader_task = tokio::spawn(async move {
      let mut explicit_close = false;
      loop {
        tokio::select! {
          biased;
          res = &mut close_rx => {
            let _ = res;
            explicit_close = true;
            break;
          }
          chunk = reader_rx.recv() => {
            match chunk {
              None => break,
              Some(chunk) => {
                let data = B64.encode(&chunk);
                if out
                  .send(Envelope {
                    v: PROTO_V,
                    id: pty_id.clone(),
                    op: Op::PtyData,
                    body: Some(serde_json::json!({ "pty_id": pty_id.clone(), "data": data })),
                  })
                  .await
                  .is_err()
                {
                  break;
                }
              }
            }
          }
        }
      }
      drop(permit);
      if !explicit_close {
        let session = {
          let mut reg = ptys.lock().await;
          reg.sessions.remove(&pty_id)
        };
        if let Some(session) = session {
          let inner = session.inner;
          let _ = tokio::task::spawn_blocking(move || terminate_pty_session(inner)).await;
          let _ = out
            .send(Envelope {
              v: PROTO_V,
              id: pty_id.clone(),
              op: Op::Result,
              body: Some(serde_json::json!({
                "ok": true,
                "pty_id": pty_id,
                "closed": true,
              })),
            })
            .await;
        }
      }
    });
    if let Err(e) = reader_task.await
      && e.is_panic()
    {
      let _ = out_panic
        .send(Envelope {
          v: PROTO_V,
          id: pty_id_panic,
          op: Op::Error,
          body: Some(serde_json::json!({ "message": "pty reader task panicked" })),
        })
        .await;
    }
  });
}

pub async fn handle_data(env: &Envelope, ptys: PtyMap) -> anyhow::Result<()> {
  let body = env
    .body
    .as_ref()
    .ok_or_else(|| anyhow::anyhow!("pty.data body"))?;
  let pty_id = body
    .get("pty_id")
    .and_then(|v| v.as_str())
    .ok_or_else(|| anyhow::anyhow!("pty_id required"))?;
  let data_b64 = body
    .get("data")
    .and_then(|v| v.as_str())
    .ok_or_else(|| anyhow::anyhow!("data required"))?;
  let bytes = B64
    .decode(data_b64)
    .map_err(|e| anyhow::anyhow!("base64: {e}"))?;

  let inner = {
    let reg = ptys.lock().await;
    let Some(session) = reg.sessions.get(pty_id) else {
      anyhow::bail!("unknown pty_id");
    };
    session.inner.clone()
  };

  tokio::task::spawn_blocking(move || {
    let mut guard = inner
      .lock()
      .map_err(|e| anyhow::anyhow!("pty lock poisoned: {e}"))?;
    guard
      .writer
      .write_all(&bytes)
      .map_err(|e| anyhow::anyhow!("pty write: {e}"))?;
    let _ = guard.writer.flush();
    Ok::<(), anyhow::Error>(())
  })
  .await
  .map_err(|e| anyhow::anyhow!("pty write join: {e}"))??;
  Ok(())
}

pub async fn handle_resize(env: &Envelope, ptys: PtyMap) -> anyhow::Result<()> {
  let body = env
    .body
    .as_ref()
    .ok_or_else(|| anyhow::anyhow!("pty.resize body"))?;
  let pty_id = body
    .get("pty_id")
    .and_then(|v| v.as_str())
    .ok_or_else(|| anyhow::anyhow!("pty_id required"))?;
  let cols = body
    .get("cols")
    .and_then(|v| v.as_u64())
    .ok_or_else(|| anyhow::anyhow!("cols required"))? as u16;
  let rows = body
    .get("rows")
    .and_then(|v| v.as_u64())
    .ok_or_else(|| anyhow::anyhow!("rows required"))? as u16;

  let inner = {
    let reg = ptys.lock().await;
    let Some(session) = reg.sessions.get(pty_id) else {
      anyhow::bail!("unknown pty_id");
    };
    session.inner.clone()
  };

  tokio::task::spawn_blocking(move || {
    let guard = inner
      .lock()
      .map_err(|e| anyhow::anyhow!("pty lock poisoned: {e}"))?;
    guard
      .master
      .resize(PtySize {
        rows,
        cols,
        pixel_width: 0,
        pixel_height: 0,
      })
      .map_err(|e| anyhow::anyhow!("pty resize: {e}"))
  })
  .await
  .map_err(|e| anyhow::anyhow!("pty resize join: {e}"))??;
  Ok(())
}

pub async fn handle_close(env: &Envelope, ptys: PtyMap) -> anyhow::Result<()> {
  let pty_id = env
    .body
    .as_ref()
    .and_then(|b| b.get("pty_id"))
    .and_then(|v| v.as_str())
    .unwrap_or(env.id.as_str())
    .to_string();
  let mut reg = ptys.lock().await;
  let Some(session) = reg.sessions.remove(&pty_id) else {
    reg.note_closed_early(pty_id);
    return Ok(());
  };
  drop(reg);
  shutdown_session(session).await;
  Ok(())
}

/// Kill every active PTY session (e.g. last browser disconnected).
pub async fn close_all(ptys: PtyMap) {
  let victims = {
    let mut reg = ptys.lock().await;
    let ids: Vec<String> = reg.sessions.keys().cloned().collect();
    let mut out = Vec::with_capacity(ids.len());
    for id in ids {
      if let Some(session) = reg.sessions.remove(&id) {
        out.push(session);
      }
    }
    out
  };
  for session in victims {
    shutdown_session(session).await;
  }
}

async fn shutdown_session(session: PtySession) {
  let _ = session.close.send(());
  let inner = session.inner;
  let _ = tokio::task::spawn_blocking(move || terminate_pty_session(inner)).await;
}

fn terminate_pty_session(inner: Arc<std::sync::Mutex<PtySessionInner>>) {
  let Ok(mut guard) = inner.lock() else {
    return;
  };
  let _ = guard.child.kill();
  let _ = guard.child.wait();
}

fn default_shell() -> String {
  std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".into())
}

/// Take a PTY slot; if full, close existing sessions (orphans after browser remount) and wait.
async fn acquire_pty_slot(ptys: PtyMap, pty_slots: Arc<Semaphore>) -> Option<OwnedSemaphorePermit> {
  if let Ok(p) = pty_slots.clone().try_acquire_owned() {
    return Some(p);
  }
  close_all(ptys).await;
  match timeout(Duration::from_secs(2), pty_slots.acquire_owned()).await {
    Ok(Ok(p)) => Some(p),
    _ => None,
  }
}

type PtyReader = Box<dyn Read + Send>;
type PtyMaster = Box<dyn MasterPty + Send>;
type PtyWriter = Box<dyn Write + Send>;
type PtyChild = Box<dyn Child + Send + Sync>;
type OpenPtyParts = (PtyReader, PtyMaster, PtyWriter, PtyChild);

fn open_pty_blocking(cols: u16, rows: u16, shell: &str) -> anyhow::Result<OpenPtyParts> {
  let system = NativePtySystem::default();
  let pair = system.openpty(PtySize {
    rows,
    cols,
    pixel_width: 0,
    pixel_height: 0,
  })?;
  let mut cmd = CommandBuilder::new(shell);
  cmd.env("TERM", "xterm-256color");
  let child = pair.slave.spawn_command(cmd)?;
  let reader = pair.master.try_clone_reader()?;
  let writer = pair.master.take_writer()?;
  Ok((reader, pair.master, writer, child))
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::time::Duration;
  use tokio::time::timeout;

  async fn recv_result(rx: &mut mpsc::Receiver<Envelope>) -> serde_json::Value {
    let msg = timeout(Duration::from_secs(5), rx.recv())
      .await
      .expect("recv timed out")
      .expect("channel closed");
    assert_eq!(msg.op, Op::Result);
    msg.body.expect("result body")
  }

  fn open_env(id: &str) -> Envelope {
    Envelope {
      v: PROTO_V,
      id: id.into(),
      op: Op::PtyOpen,
      body: Some(serde_json::json!({"cols":80,"rows":24,"shell":"/bin/sh"})),
    }
  }

  #[tokio::test]
  async fn open_replies_with_result_and_streams_data() {
    let env = open_env("t1");
    let (tx, mut rx) = mpsc::channel(64);
    let ptys = new_pty_map();
    let pty_slots = Arc::new(Semaphore::new(MAX_PTYS));

    timeout(
      Duration::from_secs(5),
      handle_open(&env, tx.clone(), ptys.clone(), pty_slots),
    )
    .await
    .expect("handle_open timed out")
    .expect("handle_open failed");

    let body = recv_result(&mut rx).await;
    assert_eq!(body.get("ok"), Some(&serde_json::json!(true)));
    assert_eq!(body.get("pty_id"), Some(&serde_json::json!("t1")));

    let data_env = Envelope {
      v: PROTO_V,
      id: "d1".into(),
      op: Op::PtyData,
      body: Some(serde_json::json!({
        "pty_id": "t1",
        "data": B64.encode(b"echo hi\n"),
      })),
    };
    handle_data(&data_env, ptys.clone())
      .await
      .expect("handle_data");

    let deadline = tokio::time::Instant::now() + Duration::from_secs(5);
    let mut saw_hi = false;
    while !saw_hi {
      let remaining = deadline.saturating_duration_since(tokio::time::Instant::now());
      if remaining.is_zero() {
        panic!("no PtyData containing hi within 5s");
      }
      let msg = timeout(remaining, rx.recv())
        .await
        .expect("recv timed out")
        .expect("channel closed");
      if msg.op != Op::PtyData {
        continue;
      }
      let Some(data_b64) = msg
        .body
        .as_ref()
        .and_then(|b| b.get("data"))
        .and_then(|v| v.as_str())
      else {
        continue;
      };
      let decoded = B64.decode(data_b64).expect("pty data b64");
      if String::from_utf8_lossy(&decoded).contains("hi") {
        saw_hi = true;
      }
    }

    let close_env = Envelope {
      v: PROTO_V,
      id: "c1".into(),
      op: Op::PtyClose,
      body: Some(serde_json::json!({"pty_id": "t1"})),
    };
    handle_close(&close_env, ptys).await.expect("handle_close");
  }

  #[tokio::test]
  async fn close_releases_slot() {
    let (tx, mut rx) = mpsc::channel(64);
    let ptys = new_pty_map();
    let pty_slots = Arc::new(Semaphore::new(1));

    timeout(
      Duration::from_secs(5),
      handle_open(&open_env("a1"), tx.clone(), ptys.clone(), pty_slots.clone()),
    )
    .await
    .expect("first open timed out")
    .expect("first open failed");

    let body = recv_result(&mut rx).await;
    assert_eq!(body.get("ok"), Some(&serde_json::json!(true)));

    handle_close(
      &Envelope {
        v: PROTO_V,
        id: "c1".into(),
        op: Op::PtyClose,
        body: Some(serde_json::json!({"pty_id": "a1"})),
      },
      ptys.clone(),
    )
    .await
    .expect("handle_close");

    timeout(
      Duration::from_secs(5),
      handle_open(&open_env("a2"), tx.clone(), ptys, pty_slots),
    )
    .await
    .expect("second open timed out")
    .expect("second open failed");

    let body = recv_result(&mut rx).await;
    assert_eq!(body.get("ok"), Some(&serde_json::json!(true)));
    assert_ne!(body.get("busy"), Some(&serde_json::json!(true)));
  }

  #[tokio::test]
  async fn open_busy_reply_carries_pty_id() {
    let (tx, mut rx) = mpsc::channel(64);
    let ptys = new_pty_map();
    let pty_slots = Arc::new(Semaphore::new(0));

    timeout(
      Duration::from_secs(5),
      handle_open(&open_env("busy1"), tx, ptys, pty_slots),
    )
    .await
    .expect("open timed out")
    .expect("open failed");

    let body = recv_result(&mut rx).await;
    assert_eq!(body.get("busy"), Some(&serde_json::json!(true)));
    assert_eq!(body.get("pty_id"), Some(&serde_json::json!("busy1")));
  }

  #[tokio::test]
  async fn close_before_open_does_not_leak() {
    let (tx, mut rx) = mpsc::channel(64);
    let ptys = new_pty_map();
    let pty_slots = Arc::new(Semaphore::new(1));

    handle_close(
      &Envelope {
        v: PROTO_V,
        id: "c0".into(),
        op: Op::PtyClose,
        body: Some(serde_json::json!({"pty_id": "r1"})),
      },
      ptys.clone(),
    )
    .await
    .expect("handle_close");

    timeout(
      Duration::from_secs(5),
      handle_open(&open_env("r1"), tx.clone(), ptys.clone(), pty_slots.clone()),
    )
    .await
    .expect("open r1 timed out")
    .expect("open r1 failed");

    let body = recv_result(&mut rx).await;
    assert_eq!(body.get("closed"), Some(&serde_json::json!(true)));

    timeout(
      Duration::from_secs(5),
      handle_open(&open_env("r2"), tx, ptys, pty_slots),
    )
    .await
    .expect("open r2 timed out")
    .expect("open r2 failed");

    let body = recv_result(&mut rx).await;
    assert_eq!(body.get("ok"), Some(&serde_json::json!(true)));
    assert_ne!(body.get("busy"), Some(&serde_json::json!(true)));
  }

  #[tokio::test]
  async fn close_all_releases_slot() {
    let (tx, mut rx) = mpsc::channel(64);
    let ptys = new_pty_map();
    let pty_slots = Arc::new(Semaphore::new(1));

    timeout(
      Duration::from_secs(5),
      handle_open(&open_env("a1"), tx.clone(), ptys.clone(), pty_slots.clone()),
    )
    .await
    .expect("first open timed out")
    .expect("first open failed");

    let body = recv_result(&mut rx).await;
    assert_eq!(body.get("ok"), Some(&serde_json::json!(true)));

    close_all(ptys.clone()).await;

    timeout(
      Duration::from_secs(5),
      handle_open(&open_env("a2"), tx, ptys, pty_slots),
    )
    .await
    .expect("second open timed out")
    .expect("second open failed");

    let body = recv_result(&mut rx).await;
    assert_eq!(body.get("ok"), Some(&serde_json::json!(true)));
    assert_ne!(body.get("busy"), Some(&serde_json::json!(true)));
  }
}
