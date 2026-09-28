import { useMemo } from "react";
import { and, eq, gte, inArray, lte, useLiveQuery } from "@tanstack/react-db";
import { latestPerServer, sumErrorLines, windowStats } from "./aggregate";
import { groupSamples } from "./groupRuns";
import type { TSampleDo, TServerDo } from "@/db/types";
import { useStreamDb } from "@/db/useStreamDb";

const METRIC_KINDS = ["monitor", "error", "overload"] as const;
const EMPTY_SAMPLES: ReadonlyArray<TSampleDo> = [];
const EMPTY_SERVERS: Array<TServerDo> = [];

export function useFleetMetrics(from: number, to: number) {
  const { db, isReady: agentReady } = useStreamDb("agent");
  const { db: aldb, isReady: liveReady } = useStreamDb("agent_live");
  const isReady = agentReady && liveReady;
  const windowMs = to - from;
  const prevFrom = from - windowMs;
  const fromIso = new Date(prevFrom).toISOString();
  const toIso = new Date(to).toISOString();
  const rangeFromIso = new Date(from).toISOString();

  const samplesLive = useLiveQuery({
    query: (q) => {
      if (!aldb) return null;
      return q
        .from({ s: aldb.collections.sample })
        .where(({ s }) =>
          and(gte(s.at, fromIso), lte(s.at, toIso), inArray(s.kind, [...METRIC_KINDS])),
        );
    },
  });

  const healthLive = useLiveQuery({
    query: (q) => {
      if (!aldb) return null;
      return q
        .from({ s: aldb.collections.sample })
        .where(({ s }) => and(eq(s.kind, "health"), gte(s.at, rangeFromIso), lte(s.at, toIso)))
        .orderBy(({ s }) => s.at, "desc")
        .limit(12);
    },
  });

  const serversLive = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q.from({ s: db.collections.server }).orderBy(({ s }) => s.name, "asc");
    },
  });

  const samples = samplesLive.data ?? EMPTY_SAMPLES;
  const healthRows = healthLive.data ?? EMPTY_SAMPLES;
  const servers = serversLive.data ?? EMPTY_SERVERS;

  const parsed = useMemo(() => groupSamples(samples), [samples]);
  const health = useMemo(() => groupSamples(healthRows).health, [healthRows]);

  const points = parsed.metrics.filter((p) => p.at >= from && p.at <= to);
  const prevPoints = parsed.metrics.filter((p) => p.at >= prevFrom && p.at < from);
  const errors = parsed.errors.filter((e) => e.at >= from && e.at <= to);
  const latest = latestPerServer(parsed.metrics);

  let online = 0;
  let offline = 0;
  let pending = 0;
  for (const s of servers) {
    if (s.status === "online") online += 1;
    else if (s.status === "offline") offline += 1;
    else if (s.status === "pending") pending += 1;
  }
  const counts = { online, offline, pending, total: servers.length };

  const cur = windowStats(points, from, to);
  const prev = windowStats(prevPoints, prevFrom, from);
  const kpis = {
    avgLoad1: cur.avgLoad1,
    prevAvgLoad1: prev.avgLoad1,
    avgMemPct: cur.avgMemPct,
    prevAvgMemPct: prev.avgMemPct,
    errorLines: sumErrorLines(parsed.errors, from, to),
    prevErrorLines: sumErrorLines(parsed.errors, prevFrom, from),
  };

  return { isReady, servers, points, prevPoints, errors, health, latest, counts, kpis };
}
