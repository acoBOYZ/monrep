import { CpuIcon, RamMemoryIcon, ServerIcon } from "@hugeicons/core-free-icons";
import { SERIES_COLOR } from "@/components/agent/charts/chartTheme";
import { KpiTile } from "@/components/agent/kpi/KpiTile";
import { delta } from "@/components/agent/metrics/aggregate";

type FleetKpisProps = {
  loading: boolean;
  online: number;
  total: number;
  kpis: {
    avgCpuPct?: number;
    prevAvgCpuPct?: number;
    avgMemPct?: number;
    prevAvgMemPct?: number;
    errorLines: number;
    prevErrorLines: number;
  };
};

/** Lean fleet KPI strip from metrics.latest (no historical sparks). */
export function FleetKpis({ loading, online, total, kpis }: FleetKpisProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <KpiTile
        label="Servers online"
        value={`${online}/${total}`}
        sparkColor={SERIES_COLOR(0)}
        loading={loading}
        icon={ServerIcon}
      />
      <KpiTile
        label="CPU used"
        value={kpis.avgCpuPct !== undefined ? kpis.avgCpuPct.toFixed(1) : "—"}
        unit={kpis.avgCpuPct !== undefined ? "%" : undefined}
        delta={delta(kpis.avgCpuPct, kpis.prevAvgCpuPct)}
        deltaFormat={(d) => `${d > 0 ? "+" : ""}${d.toFixed(1)}%`}
        invert
        sparkColor={SERIES_COLOR(0)}
        loading={loading}
        icon={CpuIcon}
      />
      <KpiTile
        label="Memory used"
        value={kpis.avgMemPct !== undefined ? kpis.avgMemPct.toFixed(1) : "—"}
        unit={kpis.avgMemPct !== undefined ? "%" : undefined}
        delta={delta(kpis.avgMemPct, kpis.prevAvgMemPct)}
        deltaFormat={(d) => `${d > 0 ? "+" : ""}${d.toFixed(1)}%`}
        invert
        sparkColor={SERIES_COLOR(1)}
        loading={loading}
        icon={RamMemoryIcon}
      />
    </div>
  );
}
