import { useMemo } from "react";
import {
  AlertDiamondIcon,
  CpuIcon,
  HardDriveIcon,
  RamMemoryIcon,
} from "@hugeicons/core-free-icons";
import type { ErrorRun, MetricPoint } from "@/components/agent/metrics/types";
import { SERIES_COLOR } from "@/components/agent/charts/chartTheme";
import { KpiTile } from "@/components/agent/kpi/KpiTile";
import { delta, toSeries } from "@/components/agent/metrics/aggregate";

type ServerKpiStripProps = {
  loading: boolean;
  latest?: MetricPoint;
  points: ReadonlyArray<MetricPoint>;
  prevPoints: ReadonlyArray<MetricPoint>;
  errors: ReadonlyArray<ErrorRun>;
  kpis: {
    prevAvgCpuPct?: number;
    prevAvgMemPct?: number;
    errorLines: number;
    prevErrorLines: number;
  };
};

function avgDisk(points: ReadonlyArray<MetricPoint>): number | undefined {
  let sum = 0;
  let n = 0;
  for (const p of points) {
    if (p.diskPct === undefined) continue;
    sum += p.diskPct;
    n += 1;
  }
  return n > 0 ? sum / n : undefined;
}

export function ServerKpiStrip({
  loading,
  latest,
  points,
  prevPoints,
  errors,
  kpis,
}: ServerKpiStripProps) {
  const cpuSpark = useMemo(
    () => toSeries(points, "cpuPct", () => "me").map(({ id, at, value }) => ({ id, at, value })),
    [points],
  );
  const memSpark = useMemo(
    () => toSeries(points, "memPct", () => "me").map(({ id, at, value }) => ({ id, at, value })),
    [points],
  );
  const diskSpark = useMemo(
    () => toSeries(points, "diskPct", () => "me").map(({ id, at, value }) => ({ id, at, value })),
    [points],
  );
  const errSpark = useMemo(
    () => errors.map((e) => ({ id: e.runId, at: new Date(e.at), value: e.newLines })),
    [errors],
  );

  const prevDisk = useMemo(() => avgDisk(prevPoints), [prevPoints]);

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <KpiTile
        label="CPU used"
        icon={CpuIcon}
        value={latest?.cpuPct !== undefined ? latest.cpuPct.toFixed(1) : "—"}
        unit={latest?.cpuPct !== undefined ? "%" : undefined}
        delta={delta(latest?.cpuPct, kpis.prevAvgCpuPct)}
        deltaFormat={(d) => `${d > 0 ? "+" : ""}${d.toFixed(1)}%`}
        invert
        spark={cpuSpark}
        sparkColor={SERIES_COLOR(0)}
        loading={loading}
      />
      <KpiTile
        label="Memory used"
        icon={RamMemoryIcon}
        value={latest?.memPct !== undefined ? latest.memPct.toFixed(1) : "—"}
        unit={latest?.memPct !== undefined ? "%" : undefined}
        delta={delta(latest?.memPct, kpis.prevAvgMemPct)}
        deltaFormat={(d) => `${d > 0 ? "+" : ""}${d.toFixed(1)}%`}
        invert
        spark={memSpark}
        sparkColor={SERIES_COLOR(1)}
        loading={loading}
      />
      <KpiTile
        label="Disk used"
        icon={HardDriveIcon}
        value={latest?.diskPct !== undefined ? latest.diskPct.toFixed(1) : "—"}
        unit="%"
        delta={delta(latest?.diskPct, prevDisk)}
        deltaFormat={(d) => `${d > 0 ? "+" : ""}${d.toFixed(1)}%`}
        invert
        spark={diskSpark}
        sparkColor={SERIES_COLOR(2)}
        loading={loading}
      />
      <KpiTile
        label="New kernel messages"
        icon={AlertDiamondIcon}
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
