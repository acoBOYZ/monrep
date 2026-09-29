//! metrics.* / events.query ops — local SQLite queries.

use crate::metrics::{MetricsDb, QueryAgg, QueryParams};
use crate::proto::{Envelope, Op, PROTO_V};
use std::sync::Arc;
use tokio::sync::mpsc;

pub async fn handle(
  env: &Envelope,
  out: mpsc::Sender<Envelope>,
  db: Arc<MetricsDb>,
) -> anyhow::Result<()> {
  match env.op {
    Op::MetricsQuery => handle_query(env, out, &db).await,
    Op::MetricsLatest => handle_latest(env, out, &db).await,
    Op::MetricsNames => handle_names(env, out, &db).await,
    Op::EventsQuery => handle_events(env, out, &db).await,
    _ => Ok(()),
  }
}

async fn handle_query(
  env: &Envelope,
  out: mpsc::Sender<Envelope>,
  db: &MetricsDb,
) -> anyhow::Result<()> {
  let body = env.body.as_ref();
  let from = body
    .and_then(|b| b.get("from"))
    .and_then(|v| v.as_i64())
    .unwrap_or(0);
  let to = body
    .and_then(|b| b.get("to"))
    .and_then(|v| v.as_i64())
    .unwrap_or(i64::MAX);
  let names = body
    .and_then(|b| b.get("names"))
    .and_then(|v| v.as_array())
    .map(|arr| {
      arr
        .iter()
        .filter_map(|x| x.as_str().map(str::to_string))
        .collect::<Vec<_>>()
    })
    .unwrap_or_default();
  let dims = body.and_then(|b| b.get("dims")).map(|v| {
    if v.is_string() {
      v.as_str().unwrap_or("{}").to_string()
    } else {
      v.to_string()
    }
  });
  let step_ms = body.and_then(|b| b.get("stepMs")).and_then(|v| v.as_i64());
  let agg = QueryAgg::parse(body.and_then(|b| b.get("agg")).and_then(|v| v.as_str()));

  let series = db.query(&QueryParams {
    from,
    to,
    names,
    dims,
    step_ms,
    agg,
  })?;

  let series_json: Vec<serde_json::Value> = series
    .into_iter()
    .map(|s| {
      serde_json::json!({
        "name": s.name,
        "dims": s.dims,
        "points": s.points.iter().map(|(a, v)| serde_json::json!([a, v])).collect::<Vec<_>>(),
      })
    })
    .collect();

  let _ = out
    .send(Envelope {
      v: PROTO_V,
      id: env.id.clone(),
      op: Op::Result,
      body: Some(serde_json::json!({ "ok": true, "series": series_json })),
    })
    .await;
  Ok(())
}

async fn handle_latest(
  env: &Envelope,
  out: mpsc::Sender<Envelope>,
  db: &MetricsDb,
) -> anyhow::Result<()> {
  let names = env
    .body
    .as_ref()
    .and_then(|b| b.get("names"))
    .and_then(|v| v.as_array())
    .map(|arr| {
      arr
        .iter()
        .filter_map(|x| x.as_str().map(str::to_string))
        .collect::<Vec<_>>()
    })
    .unwrap_or_else(|| {
      vec![
        "cpu.load.1m".into(),
        "mem.used_pct".into(),
        "disk.used_pct".into(),
      ]
    });
  let points = db.latest(&names)?;
  let _ = out
    .send(Envelope {
      v: PROTO_V,
      id: env.id.clone(),
      op: Op::Result,
      body: Some(serde_json::json!({ "ok": true, "points": points })),
    })
    .await;
  Ok(())
}

async fn handle_names(
  env: &Envelope,
  out: mpsc::Sender<Envelope>,
  db: &MetricsDb,
) -> anyhow::Result<()> {
  let names = db.names()?;
  let _ = out
    .send(Envelope {
      v: PROTO_V,
      id: env.id.clone(),
      op: Op::Result,
      body: Some(serde_json::json!({ "ok": true, "names": names })),
    })
    .await;
  Ok(())
}

async fn handle_events(
  env: &Envelope,
  out: mpsc::Sender<Envelope>,
  db: &MetricsDb,
) -> anyhow::Result<()> {
  let body = env.body.as_ref();
  let from = body
    .and_then(|b| b.get("from"))
    .and_then(|v| v.as_i64())
    .unwrap_or(0);
  let to = body
    .and_then(|b| b.get("to"))
    .and_then(|v| v.as_i64())
    .unwrap_or(i64::MAX);
  let kinds = body
    .and_then(|b| b.get("kinds"))
    .and_then(|v| v.as_array())
    .map(|arr| {
      arr
        .iter()
        .filter_map(|x| x.as_str().map(str::to_string))
        .collect::<Vec<_>>()
    });
  let limit = body
    .and_then(|b| b.get("limit"))
    .and_then(|v| v.as_u64())
    .unwrap_or(50) as usize;
  let events = db.query_events(from, to, kinds.as_deref(), limit)?;
  let _ = out
    .send(Envelope {
      v: PROTO_V,
      id: env.id.clone(),
      op: Op::Result,
      body: Some(serde_json::json!({ "ok": true, "events": events })),
    })
    .await;
  Ok(())
}
