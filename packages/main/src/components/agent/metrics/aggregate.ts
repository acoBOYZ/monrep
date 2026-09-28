import type { MetricPoint } from "./types";

const MERGE_FIELDS = [
  "load1",
  "load5",
  "load15",
  "memPct",
  "memUsedBytes",
  "memTotalBytes",
  "diskPct",
  "cores",
] as const;

/** Prefers later `at` values. Callers should pass points already ordered by `at` asc (e.g. groupSamples). */
export function mergeLatest(points: ReadonlyArray<MetricPoint>): MetricPoint | undefined {
  if (points.length === 0) return undefined;
  const newest = points[points.length - 1]!;
  const merged: MetricPoint = {
    serverId: newest.serverId,
    runId: newest.runId,
    at: newest.at,
  };
  for (const p of points) {
    for (const f of MERGE_FIELDS) {
      const v = p[f];
      if (v !== undefined) merged[f] = v;
    }
  }
  return merged;
}

export function latestPerServer(points: ReadonlyArray<MetricPoint>): Map<string, MetricPoint> {
  const groups = new Map<string, Array<MetricPoint>>();
  for (const p of points) {
    const list = groups.get(p.serverId);
    if (list) list.push(p);
    else groups.set(p.serverId, [p]);
  }
  const map = new Map<string, MetricPoint>();
  for (const [serverId, pts] of groups) {
    const merged = mergeLatest(pts);
    if (merged) map.set(serverId, merged);
  }
  return map;
}

export function windowStats(
  points: ReadonlyArray<MetricPoint>,
  from: number,
  to: number,
): { avgLoad1?: number; avgMemPct?: number; maxLoad1?: number } {
  let loadSum = 0;
  let loadCount = 0;
  let memSum = 0;
  let memCount = 0;
  let maxLoad1: number | undefined;

  for (const p of points) {
    if (p.at < from || p.at > to) continue;
    if (p.load1 !== undefined) {
      loadSum += p.load1;
      loadCount += 1;
      if (maxLoad1 === undefined || p.load1 > maxLoad1) maxLoad1 = p.load1;
    }
    if (p.memPct !== undefined) {
      memSum += p.memPct;
      memCount += 1;
    }
  }

  return {
    avgLoad1: loadCount > 0 ? loadSum / loadCount : undefined,
    avgMemPct: memCount > 0 ? memSum / memCount : undefined,
    maxLoad1,
  };
}

export function sumErrorLines(
  runs: ReadonlyArray<{ at: number; newLines: number }>,
  from: number,
  to: number,
): number {
  let n = 0;
  for (const r of runs) {
    if (r.at >= from && r.at <= to) n += r.newLines;
  }
  return n;
}

export function delta(current?: number, previous?: number): number | undefined {
  if (current === undefined || previous === undefined) return undefined;
  return current - previous;
}

export function toSeries(
  points: ReadonlyArray<MetricPoint>,
  key: "load1" | "load5" | "load15" | "memPct" | "diskPct",
  labelOf: (p: MetricPoint) => string,
): Array<{ id: string; at: Date; value: number; series: string }> {
  // TanStack Charts stack/line marks require one value per (at, series).
  const byKey = new Map<string, { id: string; at: Date; value: number; series: string }>();
  for (const p of points) {
    const value = p[key];
    if (value === undefined) continue;
    const series = labelOf(p);
    const at = new Date(p.at);
    byKey.set(`${at.getTime()}\0${series}`, {
      id: `${p.runId}-${key}`,
      at,
      value,
      series,
    });
  }
  return [...byKey.values()].sort((a, b) => a.at.getTime() - b.at.getTime());
}
