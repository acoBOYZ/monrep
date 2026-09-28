import { useMemo } from "react";
import { and, eq, gte, inArray, lte, useLiveQuery } from "@tanstack/react-db";
import { mergeLatest, sumErrorLines, windowStats } from "./aggregate";
import { groupSamples } from "./groupRuns";
import type { TSampleDo } from "@/db/types";
import { useStreamDb } from "@/db/useStreamDb";

const METRIC_KINDS = ["monitor", "error", "overload"] as const;
const EMPTY_SAMPLES: ReadonlyArray<TSampleDo> = [];

export function useServerMetrics(serverId: string, from: number, to: number) {
  const { db, isReady } = useStreamDb("agent_live");
  const windowMs = to - from;
  const prevFrom = from - windowMs;
  const fromIso = new Date(prevFrom).toISOString();
  const toIso = new Date(to).toISOString();
  const rangeFromIso = new Date(from).toISOString();

  const { data: samplesLive } = useLiveQuery({
    query: (q) => {
      if (!db || !serverId) return null;
      return q
        .from({ s: db.collections.sample })
        .where(({ s }) =>
          and(
            eq(s.serverId, serverId),
            gte(s.at, fromIso),
            lte(s.at, toIso),
            inArray(s.kind, [...METRIC_KINDS]),
          ),
        );
    },
  });

  const { data: healthLive } = useLiveQuery({
    query: (q) => {
      if (!db || !serverId) return null;
      return q
        .from({ s: db.collections.sample })
        .where(({ s }) =>
          and(
            eq(s.serverId, serverId),
            eq(s.kind, "health"),
            gte(s.at, rangeFromIso),
            lte(s.at, toIso),
          ),
        )
        .orderBy(({ s }) => s.at, "desc")
        .limit(12);
    },
  });

  const samples = samplesLive ?? EMPTY_SAMPLES;
  const healthRows = healthLive ?? EMPTY_SAMPLES;

  const parsed = useMemo(() => groupSamples(samples), [samples]);
  const health = useMemo(() => groupSamples(healthRows).health, [healthRows]);

  const points = parsed.metrics.filter((p) => p.at >= from && p.at <= to);
  const prevPoints = parsed.metrics.filter((p) => p.at >= prevFrom && p.at < from);
  const errors = parsed.errors.filter((e) => e.at >= from && e.at <= to);
  const latest = mergeLatest(parsed.metrics);

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

  return { isReady, points, prevPoints, errors, health, latest, kpis };
}
