//! rusqlite store for metrics + events.

use crate::error::{AgentError, Result};
use rusqlite::{Connection, OptionalExtension, params};
use serde_json::json;
use std::path::Path;
use std::sync::Mutex;

#[derive(Debug, Clone)]
pub struct MetricPoint {
  pub at: i64,
  pub name: String,
  pub value: f64,
  pub dims: String,
}

#[derive(Debug, Clone)]
pub struct SeriesPoints {
  pub name: String,
  pub dims: String,
  pub points: Vec<(i64, f64)>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum QueryAgg {
  Avg,
  Min,
  Max,
}

impl QueryAgg {
  pub fn parse(s: Option<&str>) -> Self {
    match s.map(|x| x.to_ascii_lowercase()).as_deref() {
      Some("min") => Self::Min,
      Some("max") => Self::Max,
      _ => Self::Avg,
    }
  }

  fn sql(self) -> &'static str {
    match self {
      Self::Avg => "avg(value)",
      Self::Min => "min(value)",
      Self::Max => "max(value)",
    }
  }
}

#[derive(Debug, Clone)]
pub struct QueryParams {
  pub from: i64,
  pub to: i64,
  pub names: Vec<String>,
  pub dims: Option<String>,
  pub step_ms: Option<i64>,
  pub agg: QueryAgg,
}

pub struct MetricsDb {
  conn: Mutex<Connection>,
}

impl MetricsDb {
  pub fn open(path: &Path) -> Result<Self> {
    if let Some(parent) = path.parent() {
      fs_err::create_dir_all(parent)?;
    }
    let conn = Connection::open(path).map_err(|e| AgentError::Other(e.into()))?;
    conn
      .execute_batch(
        "
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS metrics (
          at INTEGER NOT NULL,
          name TEXT NOT NULL,
          value REAL NOT NULL,
          dims TEXT NOT NULL DEFAULT '{}'
        );
        CREATE INDEX IF NOT EXISTS metrics_name_at ON metrics(name, at);
        CREATE INDEX IF NOT EXISTS metrics_at ON metrics(at);
        CREATE TABLE IF NOT EXISTS events (
          at INTEGER NOT NULL,
          kind TEXT NOT NULL,
          payload TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS events_kind_at ON events(kind, at);
        ",
      )
      .map_err(|e| AgentError::Other(e.into()))?;
    Ok(Self {
      conn: Mutex::new(conn),
    })
  }

  pub fn insert_metrics(&self, points: &[MetricPoint]) -> Result<()> {
    if points.is_empty() {
      return Ok(());
    }
    let conn = self
      .conn
      .lock()
      .map_err(|e| AgentError::Other(anyhow::anyhow!("{e}")))?;
    let tx = conn
      .unchecked_transaction()
      .map_err(|e| AgentError::Other(e.into()))?;
    {
      let mut stmt = tx
        .prepare("INSERT INTO metrics (at, name, value, dims) VALUES (?1, ?2, ?3, ?4)")
        .map_err(|e| AgentError::Other(e.into()))?;
      for p in points {
        stmt
          .execute(params![p.at, p.name, p.value, p.dims])
          .map_err(|e| AgentError::Other(e.into()))?;
      }
    }
    tx.commit().map_err(|e| AgentError::Other(e.into()))?;
    Ok(())
  }

  pub fn insert_event(&self, at: i64, kind: &str, payload: &str) -> Result<()> {
    let conn = self
      .conn
      .lock()
      .map_err(|e| AgentError::Other(anyhow::anyhow!("{e}")))?;
    conn
      .execute(
        "INSERT INTO events (at, kind, payload) VALUES (?1, ?2, ?3)",
        params![at, kind, payload],
      )
      .map_err(|e| AgentError::Other(e.into()))?;
    Ok(())
  }

  pub fn prune_before(&self, cutoff_ms: i64) -> Result<usize> {
    let conn = self
      .conn
      .lock()
      .map_err(|e| AgentError::Other(anyhow::anyhow!("{e}")))?;
    let m = conn
      .execute("DELETE FROM metrics WHERE at < ?1", params![cutoff_ms])
      .map_err(|e| AgentError::Other(e.into()))?;
    let e = conn
      .execute("DELETE FROM events WHERE at < ?1", params![cutoff_ms])
      .map_err(|e| AgentError::Other(e.into()))?;
    Ok(m + e)
  }

  pub fn query(&self, q: &QueryParams) -> Result<Vec<SeriesPoints>> {
    let conn = self
      .conn
      .lock()
      .map_err(|e| AgentError::Other(anyhow::anyhow!("{e}")))?;
    let mut out = Vec::new();
    for name in &q.names {
      let series = if let Some(step) = q.step_ms.filter(|s| *s > 0) {
        self.query_stepped(&conn, name, q, step)?
      } else {
        self.query_raw(&conn, name, q)?
      };
      out.extend(series);
    }
    Ok(out)
  }

  fn query_raw(&self, conn: &Connection, name: &str, q: &QueryParams) -> Result<Vec<SeriesPoints>> {
    let mut map: std::collections::BTreeMap<String, SeriesPoints> =
      std::collections::BTreeMap::new();
    let mut rows: Vec<(i64, f64, String)> = Vec::new();
    if let Some(dims) = &q.dims {
      let mut stmt = conn
        .prepare(
          "SELECT at, value, dims FROM metrics WHERE name = ?1 AND at >= ?2 AND at <= ?3 AND dims = ?4 ORDER BY at ASC",
        )
        .map_err(|e| AgentError::Other(e.into()))?;
      let mapped = stmt
        .query_map(params![name, q.from, q.to, dims], |row| {
          Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, f64>(1)?,
            row.get::<_, String>(2)?,
          ))
        })
        .map_err(|e| AgentError::Other(e.into()))?;
      for row in mapped {
        rows.push(row.map_err(|e| AgentError::Other(e.into()))?);
      }
    } else {
      let mut stmt = conn
        .prepare(
          "SELECT at, value, dims FROM metrics WHERE name = ?1 AND at >= ?2 AND at <= ?3 ORDER BY at ASC",
        )
        .map_err(|e| AgentError::Other(e.into()))?;
      let mapped = stmt
        .query_map(params![name, q.from, q.to], |row| {
          Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, f64>(1)?,
            row.get::<_, String>(2)?,
          ))
        })
        .map_err(|e| AgentError::Other(e.into()))?;
      for row in mapped {
        rows.push(row.map_err(|e| AgentError::Other(e.into()))?);
      }
    }
    for (at, value, dims) in rows {
      let entry = map.entry(dims.clone()).or_insert_with(|| SeriesPoints {
        name: name.to_string(),
        dims,
        points: Vec::new(),
      });
      entry.points.push((at, value));
    }
    Ok(map.into_values().collect())
  }

  fn query_stepped(
    &self,
    conn: &Connection,
    name: &str,
    q: &QueryParams,
    step: i64,
  ) -> Result<Vec<SeriesPoints>> {
    let agg = q.agg.sql();
    let mut map: std::collections::BTreeMap<String, SeriesPoints> =
      std::collections::BTreeMap::new();
    let mut rows: Vec<(i64, f64, String)> = Vec::new();
    if let Some(dims) = &q.dims {
      let sql = format!(
        "SELECT (at / ?1) * ?1 AS bucket, {agg}, dims FROM metrics
         WHERE name = ?2 AND at >= ?3 AND at <= ?4 AND dims = ?5
         GROUP BY bucket, dims ORDER BY bucket ASC"
      );
      let mut stmt = conn
        .prepare(&sql)
        .map_err(|e| AgentError::Other(e.into()))?;
      let mapped = stmt
        .query_map(params![step, name, q.from, q.to, dims], |row| {
          Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, f64>(1)?,
            row.get::<_, String>(2)?,
          ))
        })
        .map_err(|e| AgentError::Other(e.into()))?;
      for row in mapped {
        rows.push(row.map_err(|e| AgentError::Other(e.into()))?);
      }
    } else {
      let sql = format!(
        "SELECT (at / ?1) * ?1 AS bucket, {agg}, dims FROM metrics
         WHERE name = ?2 AND at >= ?3 AND at <= ?4
         GROUP BY bucket, dims ORDER BY bucket ASC"
      );
      let mut stmt = conn
        .prepare(&sql)
        .map_err(|e| AgentError::Other(e.into()))?;
      let mapped = stmt
        .query_map(params![step, name, q.from, q.to], |row| {
          Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, f64>(1)?,
            row.get::<_, String>(2)?,
          ))
        })
        .map_err(|e| AgentError::Other(e.into()))?;
      for row in mapped {
        rows.push(row.map_err(|e| AgentError::Other(e.into()))?);
      }
    }
    for (at, value, dims) in rows {
      let entry = map.entry(dims.clone()).or_insert_with(|| SeriesPoints {
        name: name.to_string(),
        dims,
        points: Vec::new(),
      });
      entry.points.push((at, value));
    }
    Ok(map.into_values().collect())
  }

  pub fn latest(&self, names: &[String]) -> Result<Vec<serde_json::Value>> {
    let conn = self
      .conn
      .lock()
      .map_err(|e| AgentError::Other(anyhow::anyhow!("{e}")))?;
    let mut out = Vec::new();
    for name in names {
      let mut stmt = conn
        .prepare("SELECT at, value, dims FROM metrics WHERE name = ?1 ORDER BY at DESC LIMIT 1")
        .map_err(|e| AgentError::Other(e.into()))?;
      let row = stmt
        .query_row(params![name], |row| {
          Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, f64>(1)?,
            row.get::<_, String>(2)?,
          ))
        })
        .optional()
        .map_err(|e| AgentError::Other(e.into()))?;
      if let Some((at, value, dims)) = row {
        out.push(json!({ "name": name, "at": at, "value": value, "dims": dims }));
      }
    }
    Ok(out)
  }

  pub fn names(&self) -> Result<Vec<String>> {
    let conn = self
      .conn
      .lock()
      .map_err(|e| AgentError::Other(anyhow::anyhow!("{e}")))?;
    let mut stmt = conn
      .prepare("SELECT DISTINCT name FROM metrics ORDER BY name ASC")
      .map_err(|e| AgentError::Other(e.into()))?;
    let rows = stmt
      .query_map([], |row| row.get::<_, String>(0))
      .map_err(|e| AgentError::Other(e.into()))?;
    let mut out = Vec::new();
    for row in rows {
      out.push(row.map_err(|e| AgentError::Other(e.into()))?);
    }
    Ok(out)
  }

  pub fn query_events(
    &self,
    from: i64,
    to: i64,
    kinds: Option<&[String]>,
    limit: usize,
  ) -> Result<Vec<serde_json::Value>> {
    let conn = self
      .conn
      .lock()
      .map_err(|e| AgentError::Other(anyhow::anyhow!("{e}")))?;
    let limit = limit.clamp(1, 500) as i64;
    let mut out = Vec::new();
    if let Some(kinds) = kinds {
      if kinds.is_empty() {
        return Ok(out);
      }
      for kind in kinds {
        let mut stmt = conn
          .prepare(
            "SELECT at, kind, payload FROM events WHERE kind = ?1 AND at >= ?2 AND at <= ?3 ORDER BY at DESC LIMIT ?4",
          )
          .map_err(|e| AgentError::Other(e.into()))?;
        let rows = stmt
          .query_map(params![kind, from, to, limit], |row| {
            Ok((
              row.get::<_, i64>(0)?,
              row.get::<_, String>(1)?,
              row.get::<_, String>(2)?,
            ))
          })
          .map_err(|e| AgentError::Other(e.into()))?;
        for row in rows {
          let (at, kind, payload) = row.map_err(|e| AgentError::Other(e.into()))?;
          let parsed: serde_json::Value =
            serde_json::from_str(&payload).unwrap_or(json!({ "raw": payload }));
          out.push(json!({ "at": at, "kind": kind, "payload": parsed }));
        }
      }
      out.sort_by(|a, b| b["at"].as_i64().cmp(&a["at"].as_i64()));
      out.truncate(limit as usize);
    } else {
      let mut stmt = conn
        .prepare(
          "SELECT at, kind, payload FROM events WHERE at >= ?1 AND at <= ?2 ORDER BY at DESC LIMIT ?3",
        )
        .map_err(|e| AgentError::Other(e.into()))?;
      let rows = stmt
        .query_map(params![from, to, limit], |row| {
          Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
          ))
        })
        .map_err(|e| AgentError::Other(e.into()))?;
      for row in rows {
        let (at, kind, payload) = row.map_err(|e| AgentError::Other(e.into()))?;
        let parsed: serde_json::Value =
          serde_json::from_str(&payload).unwrap_or(json!({ "raw": payload }));
        out.push(json!({ "at": at, "kind": kind, "payload": parsed }));
      }
    }
    Ok(out)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::time::{SystemTime, UNIX_EPOCH};

  fn tmp_db() -> MetricsDb {
    let dir = std::env::temp_dir().join(format!(
      "monrep-metrics-{}",
      SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos()
    ));
    fs_err::create_dir_all(&dir).unwrap();
    MetricsDb::open(&dir.join("m.sqlite")).unwrap()
  }

  #[test]
  fn insert_query_prune() {
    let db = tmp_db();
    let at = 1_700_000_000_000i64;
    db.insert_metrics(&[MetricPoint {
      at,
      name: "cpu.load.1m".into(),
      value: 0.5,
      dims: "{}".into(),
    }])
    .unwrap();
    let series = db
      .query(&QueryParams {
        from: at - 1000,
        to: at + 1000,
        names: vec!["cpu.load.1m".into()],
        dims: None,
        step_ms: None,
        agg: QueryAgg::Avg,
      })
      .unwrap();
    assert_eq!(series.len(), 1);
    assert_eq!(series[0].points.len(), 1);
    assert_eq!(db.prune_before(at + 1).unwrap(), 1);
  }
}
