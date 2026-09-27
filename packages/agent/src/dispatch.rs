//! Dispatch inbound frames from the active tunnel session only.

use crate::ops;
use crate::ops::registry::RunRegistry;
use crate::proto::Envelope;
use std::sync::Arc;
use tokio::sync::{Semaphore, mpsc};

pub async fn dispatch(
  env: Envelope,
  out: mpsc::Sender<Envelope>,
  runs: RunRegistry,
  run_slots: Arc<Semaphore>,
) -> anyhow::Result<()> {
  ops::handle(env, out, runs, run_slots).await
}
