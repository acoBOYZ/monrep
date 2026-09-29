import type { HealthEvent, MetricPoint } from "./types";

export type MetricsSeries = {
  name: string;
  dims: string;
  points: Array<[number, number]>;
};

export type MetricsLatestPoint = {
  name: string;
  at: number;
  value: number;
  dims: string;
};

const NAME_FIELD = {
  "cpu.used_pct": "cpuPct",
  "cpu.load.1m": "load1",
  "cpu.load.5m": "load5",
  "cpu.load.15m": "load15",
  "mem.used_pct": "memPct",
  "mem.used_bytes": "memUsedBytes",
  "mem.total_bytes": "memTotalBytes",
  "disk.used_pct": "diskPct",
  "host.nproc": "cores",
} as const;

export type MetricSeriesName = keyof typeof NAME_FIELD;

export const CHART_METRIC_NAMES: ReadonlyArray<MetricSeriesName> = [
  "cpu.used_pct",
  "cpu.load.1m",
  "cpu.load.5m",
  "cpu.load.15m",
  "mem.used_pct",
  "mem.used_bytes",
  "mem.total_bytes",
  "disk.used_pct",
  "host.nproc",
];

export const LATEST_METRIC_NAMES: ReadonlyArray<MetricSeriesName> = [
  "cpu.used_pct",
  "cpu.load.1m",
  "mem.used_pct",
  "disk.used_pct",
  "host.nproc",
];

function fieldFor(name: string): (typeof NAME_FIELD)[MetricSeriesName] | undefined {
  if (Object.hasOwn(NAME_FIELD, name)) return NAME_FIELD[name as MetricSeriesName];
  return undefined;
}

function preferSeries(name: string, dims: string): boolean {
  if (!name.startsWith("disk.")) return true;
  if (dims === "{}" || dims.length === 0) return true;
  return dims.includes('"/"');
}

/** Merge narrow timeseries rows into chart MetricPoints (one row per timestamp). */
export function seriesToMetricPoints(
  serverId: string,
  series: ReadonlyArray<MetricsSeries>,
): Array<MetricPoint> {
  const byAt = new Map<number, MetricPoint>();
  for (const s of series) {
    const field = fieldFor(s.name);
    if (field === undefined) continue;
    if (!preferSeries(s.name, s.dims)) continue;
    for (const pair of s.points) {
      const at = pair[0];
      const value = pair[1];
      if (!Number.isFinite(at) || !Number.isFinite(value)) continue;
      let point = byAt.get(at);
      if (!point) {
        point = { serverId, runId: `${serverId}-${at}`, at };
        byAt.set(at, point);
      }
      point[field] = value;
    }
  }
  return [...byAt.values()].sort((a, b) => a.at - b.at);
}

/** Build a single MetricPoint from metrics.latest rows. */
export function latestPointsToMetric(
  serverId: string,
  points: ReadonlyArray<MetricsLatestPoint>,
): MetricPoint | undefined {
  if (points.length === 0) return undefined;
  let at = 0;
  const out: MetricPoint = { serverId, runId: `${serverId}-latest`, at: 0 };
  for (const p of points) {
    const field = fieldFor(p.name);
    if (field === undefined) continue;
    if (!preferSeries(p.name, p.dims)) continue;
    if (!Number.isFinite(p.value)) continue;
    out[field] = p.value;
    if (p.at > at) at = p.at;
  }
  if (at === 0 && out.cpuPct === undefined && out.load1 === undefined && out.memPct === undefined) {
    return undefined;
  }
  out.at = at;
  return out;
}

export function eventsToHealth(
  serverId: string,
  events: ReadonlyArray<{ at: number; kind: string; payload: unknown }>,
): Array<HealthEvent> {
  const out: Array<HealthEvent> = [];
  for (const ev of events) {
    if (ev.kind !== "health") continue;
    const payload =
      ev.payload && typeof ev.payload === "object" ? (ev.payload as Record<string, unknown>) : null;
    if (!payload) continue;
    const level = payload.level;
    if (level !== "info" && level !== "warn" && level !== "error") continue;
    const code = typeof payload.code === "string" ? payload.code : "";
    const message = typeof payload.message === "string" ? payload.message : "";
    out.push({
      id: `${serverId}-${ev.at}-${code}`,
      serverId,
      at: ev.at,
      level,
      code,
      message,
    });
  }
  return out;
}

/** Rollup step for chart density (~120 buckets across the window). */
export function stepMsForRange(from: number, to: number): number {
  const span = Math.max(to - from, 60_000);
  const raw = Math.floor(span / 120);
  return Math.max(15_000, raw);
}
