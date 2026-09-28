import type { MetricPoint } from "./types";

export function memoryChartEmptyMessage(points: ReadonlyArray<MetricPoint>): string {
  if (points.length === 0) return "No memory samples in range";
  const hasLoad = points.some((p) => p.load1 !== undefined);
  const hasMem = points.some((p) => p.memPct !== undefined);
  if (hasLoad && !hasMem) {
    return "No memory samples (host has no free/nproc)";
  }
  return "No memory samples in range";
}
