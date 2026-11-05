//! `run` op — spawn a process and stream stdout/stderr as event frames.

use crate::ops::registry::RunRegistry;
use crate::proto::{Envelope, Op, PROTO_V, RunBody};
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncRead, BufReader};
use tokio::process::Command;
use tokio::sync::{Semaphore, mpsc};

/// Max concurrent process runs per tunnel session.
pub const MAX_RUNS: usize = 4;
/// Truncate a single stdout/stderr event line (bytes).
pub const MAX_LINE: usize = 8 * 1024;

pub async fn handle(
  env: &Envelope,
  out: mpsc::Sender<Envelope>,
  runs: RunRegistry,
  run_slots: Arc<Semaphore>,
) -> anyhow::Result<()> {
  let body: RunBody = match &env.body {
    Some(v) => serde_json::from_value(v.clone())?,
    None => anyhow::bail!("run requires body"),
  };
  if body.argv.is_empty() {
    anyhow::bail!("run.argv must be non-empty");
  }

  let Ok(permit) = run_slots.clone().try_acquire_owned() else {
    let _ = out
      .send(Envelope {
        v: PROTO_V,
        id: env.id.clone(),
        op: Op::Result,
        body: Some(serde_json::json!({
          "ok": false,
          "busy": true,
          "message": "busy",
        })),
      })
      .await;
    return Ok(());
  };

  let program = &body.argv[0];
  let args = &body.argv[1..];
  let mut cmd = Command::new(program);
  cmd
    .args(args)
    .stdout(std::process::Stdio::piped())
    .stderr(std::process::Stdio::piped())
    .kill_on_drop(true);
  if let Some(cwd) = &body.cwd {
    cmd.current_dir(cwd);
  }

  let mut child = match cmd.spawn() {
    Ok(c) => c,
    Err(e) => {
      drop(permit);
      return Err(e.into());
    }
  };
  let stdout = child.stdout.take();
  let stderr = child.stderr.take();
  {
    let mut map = runs.lock().await;
    map.insert(env.id.clone(), child);
  }

  let stdout_task = spawn_stream_reader(stdout, env.id.clone(), out.clone(), "stdout");
  let stderr_task = spawn_stream_reader(stderr, env.id.clone(), out.clone(), "stderr");
  let _ = stdout_task.await;
  let _ = stderr_task.await;

  let child = {
    let mut map = runs.lock().await;
    map.remove(&env.id)
  };
  let Some(mut child) = child else {
    let _ = out
      .send(Envelope {
        v: PROTO_V,
        id: env.id.clone(),
        op: Op::Result,
        body: Some(serde_json::json!({ "ok": false, "cancelled": true })),
      })
      .await;
    drop(permit);
    return Ok(());
  };
  let status = child.wait().await?;

  let code = status.code().unwrap_or(-1);
  let _ = out
    .send(Envelope {
      v: PROTO_V,
      id: env.id.clone(),
      op: Op::Result,
      body: Some(serde_json::json!({
        "ok": status.success(),
        "exit_code": code,
      })),
    })
    .await;
  drop(permit);
  Ok(())
}

fn spawn_stream_reader(
  pipe: Option<impl AsyncRead + Unpin + Send + 'static>,
  run_id: String,
  out: mpsc::Sender<Envelope>,
  stream: &'static str,
) -> tokio::task::JoinHandle<()> {
  tokio::spawn(async move {
    let Some(pipe) = pipe else {
      return;
    };
    let mut lines = BufReader::new(pipe).lines();
    while let Ok(Some(mut line)) = lines.next_line().await {
      if line.len() > MAX_LINE {
        line.truncate(MAX_LINE);
      }
      if out
        .send(Envelope {
          v: PROTO_V,
          id: run_id.clone(),
          op: Op::Event,
          body: Some(serde_json::json!({ "stream": stream, "line": line })),
        })
        .await
        .is_err()
      {
        break;
      }
    }
  })
}
