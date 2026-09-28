import { useMemo } from "react";
import type { MetricPoint } from "@/components/agent/metrics/types";
import type { TServerDo } from "@/db/types";
import { toSeries } from "@/components/agent/metrics/aggregate";

export function useFleetSeries(
  points: ReadonlyArray<MetricPoint>,
  servers: ReadonlyArray<TServerDo>,
) {
  return useMemo(() => {
    const nameOf = new Map<string, string>();
    for (const s of servers) {
      if (typeof s.id === "string") nameOf.set(s.id, s.name);
    }
    const label = (p: MetricPoint) => nameOf.get(p.serverId) ?? p.serverId;
    return {
      loadSeries: toSeries(points, "load1", label),
      memSeries: toSeries(points, "memPct", label),
    };
  }, [points, servers]);
}
