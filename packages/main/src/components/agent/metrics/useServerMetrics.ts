import { useEffect, useState } from "react";
import { mergeLatest, sumErrorLines, windowStats } from "./aggregate";
import {
  CHART_METRIC_NAMES,
  eventsToHealth,
  seriesToMetricPoints,
  stepMsForRange,
} from "./seriesMap";
import { sessionRequest } from "./sessionRequest";
import type { MetricsSeries } from "./seriesMap";
import type { ErrorRun, HealthEvent, MetricPoint } from "./types";

const EMPTY_POINTS: ReadonlyArray<MetricPoint> = [];
const EMPTY_ERRORS: ReadonlyArray<ErrorRun> = [];
const EMPTY_HEALTH: ReadonlyArray<HealthEvent> = [];

type QueryState = {
  points: ReadonlyArray<MetricPoint>;
  prevPoints: ReadonlyArray<MetricPoint>;
  health: ReadonlyArray<HealthEvent>;
  ready: boolean;
};

function parseSeries(body: unknown): Array<MetricsSeries> {
  if (!body || typeof body !== "object") return [];
  const series = (body as { series?: unknown }).series;
  if (!Array.isArray(series)) return [];
  const out: Array<MetricsSeries> = [];
  for (const row of series) {
    if (!row || typeof row !== "object") continue;
    const r = row as { name?: unknown; dims?: unknown; points?: unknown };
    if (typeof r.name !== "string") continue;
    const dims = typeof r.dims === "string" ? r.dims : "{}";
    const points: Array<[number, number]> = [];
    if (Array.isArray(r.points)) {
      for (const p of r.points) {
        if (!Array.isArray(p) || p.length < 2) continue;
        const at = Number(p[0]);
        const value = Number(p[1]);
        if (Number.isFinite(at) && Number.isFinite(value)) points.push([at, value]);
      }
    }
    out.push({ name: r.name, dims, points });
  }
  return out;
}

function parseEvents(body: unknown): Array<{ at: number; kind: string; payload: unknown }> {
  if (!body || typeof body !== "object") return [];
  const events = (body as { events?: unknown }).events;
  if (!Array.isArray(events)) return [];
  const out: Array<{ at: number; kind: string; payload: unknown }> = [];
  for (const row of events) {
    if (!row || typeof row !== "object") continue;
    const r = row as { at?: unknown; kind?: unknown; payload?: unknown };
    const at = typeof r.at === "number" ? r.at : Number(r.at);
    if (!Number.isFinite(at) || typeof r.kind !== "string") continue;
    out.push({ at, kind: r.kind, payload: r.payload });
  }
  return out;
}

export function useServerMetrics(serverId: string, from: number, to: number) {
  const windowMs = to - from;
  const prevFrom = from - windowMs;
  const [state, setState] = useState<QueryState>({
    points: EMPTY_POINTS,
    prevPoints: EMPTY_POINTS,
    health: EMPTY_HEALTH,
    ready: false,
  });

  useEffect(() => {
    if (!serverId) return;
    let cancelled = false;
    const run = async () => {
      try {
        const stepMs = stepMsForRange(from, to);
        const [metricsEnv, prevEnv, eventsEnv] = await Promise.all([
          sessionRequest(serverId, "metrics.query", {
            from,
            to,
            names: [...CHART_METRIC_NAMES],
            stepMs,
            agg: "avg",
          }),
          sessionRequest(serverId, "metrics.query", {
            from: prevFrom,
            to: from,
            names: ["cpu.used_pct", "cpu.load.1m", "mem.used_pct", "disk.used_pct"],
            stepMs,
            agg: "avg",
          }),
          sessionRequest(serverId, "events.query", {
            from,
            to,
            kinds: ["health"],
            limit: 12,
          }),
        ]);
        if (cancelled) return;
        const points =
          metricsEnv.op === "result"
            ? seriesToMetricPoints(serverId, parseSeries(metricsEnv.body))
            : [];
        const prevPoints =
          prevEnv.op === "result" ? seriesToMetricPoints(serverId, parseSeries(prevEnv.body)) : [];
        const health =
          eventsEnv.op === "result" ? eventsToHealth(serverId, parseEvents(eventsEnv.body)) : [];
        setState({ points, prevPoints, health, ready: true });
      } catch {
        if (!cancelled) {
          setState({
            points: EMPTY_POINTS,
            prevPoints: EMPTY_POINTS,
            health: EMPTY_HEALTH,
            ready: true,
          });
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [serverId, from, to, prevFrom]);

  const points = state.points;
  const prevPoints = state.prevPoints;
  const errors = EMPTY_ERRORS;
  const health = state.health;
  const latest = mergeLatest(points);
  const cur = windowStats(points, from, to);
  const prev = windowStats(prevPoints, prevFrom, from);
  const kpis = {
    avgCpuPct: cur.avgCpuPct,
    prevAvgCpuPct: prev.avgCpuPct,
    avgLoad1: cur.avgLoad1,
    prevAvgLoad1: prev.avgLoad1,
    avgMemPct: cur.avgMemPct,
    prevAvgMemPct: prev.avgMemPct,
    errorLines: sumErrorLines(errors, from, to),
    prevErrorLines: sumErrorLines(errors, prevFrom, from),
  };

  return {
    isReady: state.ready,
    points,
    prevPoints,
    errors,
    health,
    latest,
    kpis,
  };
}
