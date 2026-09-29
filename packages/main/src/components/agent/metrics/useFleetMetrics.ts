import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { LATEST_METRIC_NAMES, latestPointsToMetric } from "./seriesMap";
import type { MetricsLatestPoint } from "./seriesMap";
import type { ErrorRun, HealthEvent, MetricPoint } from "./types";
import type { TServerDo } from "@/db/types";
import { useStreamDb } from "@/db/useStreamDb";
import { fetchMetricsLatestFn } from "@/server/agent/functions";

const EMPTY_POINTS: ReadonlyArray<MetricPoint> = [];
const EMPTY_ERRORS: ReadonlyArray<ErrorRun> = [];
const EMPTY_HEALTH: ReadonlyArray<HealthEvent> = [];
const EMPTY_SERVERS: Array<TServerDo> = [];
const EMPTY_LATEST = new Map<string, MetricPoint>();

function parseLatestPoints(body: unknown): Array<MetricsLatestPoint> {
  if (!body || typeof body !== "object") return [];
  const points = (body as { points?: unknown }).points;
  if (!Array.isArray(points)) return [];
  const out: Array<MetricsLatestPoint> = [];
  for (const row of points) {
    if (!row || typeof row !== "object") continue;
    const r = row as { name?: unknown; at?: unknown; value?: unknown; dims?: unknown };
    if (typeof r.name !== "string") continue;
    const at = typeof r.at === "number" ? r.at : Number(r.at);
    const value = typeof r.value === "number" ? r.value : Number(r.value);
    if (!Number.isFinite(at) || !Number.isFinite(value)) continue;
    out.push({
      name: r.name,
      at,
      value,
      dims: typeof r.dims === "string" ? r.dims : "{}",
    });
  }
  return out;
}

async function fetchLatestMap(ids: ReadonlyArray<string>): Promise<Map<string, MetricPoint>> {
  const entries = await Promise.all(
    ids.map(async (serverId) => {
      try {
        const res = await fetchMetricsLatestFn({
          data: { serverId, names: [...LATEST_METRIC_NAMES] },
        });
        if (!res.ok) return null;
        const point = latestPointsToMetric(serverId, parseLatestPoints(res.body));
        return point ? ([serverId, point] as const) : null;
      } catch {
        return null;
      }
    }),
  );
  const map = new Map<string, MetricPoint>();
  for (const e of entries) {
    if (e) map.set(e[0], e[1]);
  }
  return map;
}

function avgField(
  latest: Map<string, MetricPoint>,
  key: "cpuPct" | "load1" | "memPct",
): number | undefined {
  let sum = 0;
  let n = 0;
  for (const p of latest.values()) {
    const v = p[key];
    if (v === undefined) continue;
    sum += v;
    n += 1;
  }
  return n > 0 ? sum / n : undefined;
}

function countStatuses(servers: ReadonlyArray<TServerDo>) {
  let online = 0;
  let offline = 0;
  let pending = 0;
  for (const s of servers) {
    if (s.status === "online") online += 1;
    else if (s.status === "offline") offline += 1;
    else if (s.status === "pending") pending += 1;
  }
  return { online, offline, pending, total: servers.length };
}

/**
 * Fleet KPIs from agent stream presence + metrics.latest per online server.
 * No multi-server historical dump over Cloudflare.
 */
export function useFleetMetrics(_from: number, _to: number) {
  const { db, isReady: agentReady } = useStreamDb("agent");
  const serversLive = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q.from({ s: db.collections.server }).orderBy(({ s }) => s.name, "asc");
    },
  });
  const servers = serversLive.data ?? EMPTY_SERVERS;

  const onlineIds = useMemo(
    () =>
      servers
        .filter((s) => s.status === "online" && s.id)
        .map((s) => s.id!)
        .sort()
        .join(","),
    [servers],
  );

  const [fetched, setFetched] = useState<{ key: string; map: Map<string, MetricPoint> }>({
    key: "",
    map: EMPTY_LATEST,
  });

  useEffect(() => {
    const ids = onlineIds ? onlineIds.split(",") : [];
    if (ids.length === 0) return;
    const key = onlineIds;
    let cancelled = false;
    void fetchLatestMap(ids).then((map) => {
      if (!cancelled) setFetched({ key, map });
    });
    return () => {
      cancelled = true;
    };
  }, [onlineIds]);

  const latest =
    onlineIds.length === 0 ? EMPTY_LATEST : fetched.key === onlineIds ? fetched.map : EMPTY_LATEST;
  const kpiReady = onlineIds.length === 0 || fetched.key === onlineIds;
  const counts = countStatuses(servers);

  const kpis = {
    avgCpuPct: avgField(latest, "cpuPct"),
    prevAvgCpuPct: undefined as number | undefined,
    avgLoad1: avgField(latest, "load1"),
    prevAvgLoad1: undefined as number | undefined,
    avgMemPct: avgField(latest, "memPct"),
    prevAvgMemPct: undefined as number | undefined,
    errorLines: 0,
    prevErrorLines: 0,
  };

  return {
    isReady: agentReady && kpiReady,
    servers,
    points: EMPTY_POINTS,
    prevPoints: EMPTY_POINTS,
    errors: EMPTY_ERRORS,
    health: EMPTY_HEALTH,
    latest,
    counts,
    kpis,
  };
}
