export type MetricPoint = {
  serverId: string;
  runId: string;
  at: number;
  cpuPct?: number;
  load1?: number;
  load5?: number;
  load15?: number;
  memPct?: number;
  memUsedBytes?: number;
  memTotalBytes?: number;
  diskPct?: number;
  cores?: number;
};

export type ErrorRun = {
  serverId: string;
  runId: string;
  at: number;
  lines: number;
  newLines: number;
};

export type HealthEvent = {
  id: string;
  serverId: string;
  at: number;
  level: "info" | "warn" | "error";
  code: string;
  message: string;
};

export type MetricRange = "30m" | "1h" | "6h" | "24h" | "7d" | "30d";

export const RANGE_MS: Record<MetricRange, number> = {
  "30m": 30 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export const RANGES: ReadonlyArray<MetricRange> = ["30m", "1h", "6h", "24h", "7d", "30d"];

export function isMetricRange(value: unknown): value is MetricRange {
  return typeof value === "string" && (RANGES as ReadonlyArray<string>).includes(value);
}
