//! Process-lifetime state: PTYs, runs, metrics DB, outbound envelopes.

use crate::metrics::{self, MetricsDb};
use crate::ops::pty::{self, MAX_PTYS, PtyMap};
use crate::ops::registry::{self, RunRegistry};
use crate::ops::run::MAX_RUNS;
use crate::proto::Envelope;
use std::sync::Arc;
use tokio::sync::{Semaphore, mpsc};

pub const OUT_QUEUE: usize = 64;

pub struct Runtime {
  pub out_tx: mpsc::Sender<Envelope>,
  pub out_rx: mpsc::Receiver<Envelope>,
  pub runs: RunRegistry,
  pub run_slots: Arc<Semaphore>,
  pub ptys: PtyMap,
  pub pty_slots: Arc<Semaphore>,
  pub metrics_db: Arc<MetricsDb>,
}

impl Runtime {
  pub fn new() -> anyhow::Result<Self> {
    let (out_tx, out_rx) = mpsc::channel(OUT_QUEUE);
    let metrics_db = Arc::new(metrics::open_default()?);
    metrics::spawn_loop(metrics_db.clone());
    Ok(Self {
      out_tx,
      out_rx,
      runs: registry::new_registry(),
      run_slots: Arc::new(Semaphore::new(MAX_RUNS)),
      ptys: pty::new_pty_map(),
      pty_slots: Arc::new(Semaphore::new(MAX_PTYS)),
      metrics_db,
    })
  }
}
