import { useMemo } from "react";
import type { ErrorRun, MetricPoint } from "@/components/agent/metrics/types";
import { SERIES_COLOR } from "@/components/agent/charts/chartTheme";
import { KpiTile } from "@/components/agent/kpi/KpiTile";
import { delta, toSeries } from "@/components/agent/metrics/aggregate";

type FleetKpisProps = {
  loading: boolean;
  online: number;
  total: number;
  points: ReadonlyArray<MetricPoint>;
  errors: ReadonlyArray<ErrorRun>;
  kpis: {
    avgLoad1?: number;
    prevAvgLoad1?: number;
    avgMemPct?: number;
    prevAvgMemPct?: number;
    errorLines: number;
    prevErrorLines: number;
  };
};

export function FleetKpis({ loading, online, total, points, errors, kpis }: FleetKpisProps) {
  const loadSpark = useMemo(
    () => toSeries(points, "load1", () => "fleet").map(({ id, at, value }) => ({ id, at, value })),
    [points],
  );
  const memSpark = useMemo(
    () => toSeries(points, "memPct", () => "fleet").map(({ id, at, value }) => ({ id, at, value })),
    [points],
  );
  const errSpark = useMemo(
    () => errors.map((e) => ({ id: e.runId, at: new Date(e.at), value: e.newLines })),
    [errors],
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiTile
        label="Servers online"
        value={`${online}/${total}`}
        sparkColor={SERIES_COLOR(0)}
        loading={loading}
      />
      <KpiTile
        label="Avg load (1m)"
        value={kpis.avgLoad1 !== undefined ? kpis.avgLoad1.toFixed(2) : "—"}
        delta={delta(kpis.avgLoad1, kpis.prevAvgLoad1)}
        deltaFormat={(d) => `${d > 0 ? "+" : ""}${d.toFixed(2)}`}
        invert
        spark={loadSpark}
        sparkColor={SERIES_COLOR(0)}
        loading={loading}
      />
      <KpiTile
        label="Memory used"
        value={kpis.avgMemPct !== undefined ? kpis.avgMemPct.toFixed(1) : "—"}
        unit={kpis.avgMemPct !== undefined ? "%" : undefined}
        delta={delta(kpis.avgMemPct, kpis.prevAvgMemPct)}
        deltaFormat={(d) => `${d > 0 ? "+" : ""}${d.toFixed(1)}%`}
        invert
        spark={memSpark}
        sparkColor={SERIES_COLOR(1)}
        loading={loading}
      />
      <KpiTile
        label="New kernel messages"
        value={String(kpis.errorLines)}
        delta={delta(kpis.errorLines, kpis.prevErrorLines)}
        deltaFormat={(d) => `${d > 0 ? "+" : ""}${d}`}
        invert
        spark={errSpark}
        sparkColor={SERIES_COLOR(3)}
        loading={loading}
      />
    </div>
  );
}
