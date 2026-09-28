import { finalizeErrorRuns } from "./finalizeErrorRuns";
import { parseMetricLines } from "./parseMetricRun";
import { parseSamplePayload } from "./parsePayload";
import type { ErrorRun, HealthEvent, MetricPoint } from "./types";
import type { TSampleDo } from "@/db/types";

function hasMetric(m: Partial<MetricPoint>): boolean {
  return (
    m.load1 !== undefined ||
    m.load5 !== undefined ||
    m.load15 !== undefined ||
    m.memPct !== undefined ||
    m.diskPct !== undefined ||
    m.cores !== undefined
  );
}

function healthFromRow(row: TSampleDo): HealthEvent | null {
  const payload = parseSamplePayload(row.payloadJson);
  if (!payload || payload.op !== "agent.health" || !payload.body) return null;
  const level = payload.body.level;
  if (level !== "info" && level !== "warn" && level !== "error") return null;
  const at = Date.parse(row.at);
  if (Number.isNaN(at)) return null;
  return {
    id: row.id ?? `${row.serverId}-${at}`,
    serverId: row.serverId,
    at,
    level,
    code: payload.body.code ?? "",
    message: payload.body.message ?? "",
  };
}

export function groupSamples(rows: ReadonlyArray<TSampleDo>): {
  metrics: Array<MetricPoint>;
  errors: Array<ErrorRun>;
  health: Array<HealthEvent>;
} {
  const metrics: Array<MetricPoint> = [];
  const errorDrafts: Array<{
    serverId: string;
    runId: string;
    at: number;
    lines: number;
    stdoutLines: Array<string>;
  }> = [];
  const health: Array<HealthEvent> = [];
  const byRun = new Map<string, Array<TSampleDo>>();

  for (const row of rows) {
    const payload = parseSamplePayload(row.payloadJson);
    if (payload?.op === "agent.health") {
      const ev = healthFromRow(row);
      if (ev) health.push(ev);
      continue;
    }
    const runId = row.runId;
    if (!runId) continue;
    const bucket = byRun.get(runId);
    if (bucket) bucket.push(row);
    else byRun.set(runId, [row]);
  }

  for (const [runId, runRows] of byRun) {
    let collector: string | undefined;
    let earliestAt = Number.POSITIVE_INFINITY;
    const stdoutLines: Array<string> = [];
    let eventLines = 0;
    const serverId = runRows[0]?.serverId;
    if (!serverId) continue;

    for (const row of runRows) {
      const at = Date.parse(row.at);
      if (!Number.isNaN(at) && at < earliestAt) earliestAt = at;
      const payload = parseSamplePayload(row.payloadJson);
      if (!payload) continue;
      if (!collector && payload.collector) collector = payload.collector;
      if (payload.op === "event" && payload.body?.stream === "stdout" && payload.body.line) {
        stdoutLines.push(payload.body.line);
        eventLines += 1;
      }
    }
    if (!Number.isFinite(earliestAt)) continue;

    if (collector === "monitor" || collector === "overload") {
      const partial = parseMetricLines(stdoutLines);
      if (!hasMetric(partial)) continue;
      metrics.push({ serverId, runId, at: earliestAt, ...partial });
    } else if (collector === "error") {
      errorDrafts.push({
        serverId,
        runId,
        at: earliestAt,
        lines: eventLines,
        stdoutLines: [...stdoutLines],
      });
    }
  }

  // Asc for charts / finalizeErrorRuns deltas. Health keeps input order (live query is desc+limit).
  const byAt = (a: { at: number }, b: { at: number }) => a.at - b.at;
  metrics.sort(byAt);
  errorDrafts.sort(byAt);
  const errors = finalizeErrorRuns(errorDrafts);
  return { metrics, errors, health };
}
