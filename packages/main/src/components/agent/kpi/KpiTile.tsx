import { ImpactFlash } from "@monrep/ui/func";
import { KpiDeltaBadge } from "./KpiDeltaBadge";
import { KpiTileSkeleton } from "./KpiTileSkeleton";
import { formatKpiDelta } from "./kpiTile.helpers";
import { Sparkline } from "@/components/agent/charts/Sparkline";

type SparkPoint = { id: string; at: Date; value: number };

type KpiTileProps = {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  deltaFormat?: (d: number) => string;
  invert?: boolean;
  spark?: ReadonlyArray<SparkPoint>;
  sparkColor: string;
  loading?: boolean;
};

export function KpiTile({
  label,
  value,
  unit,
  delta,
  deltaFormat,
  invert,
  spark,
  sparkColor,
  loading,
}: KpiTileProps) {
  if (loading) return <KpiTileSkeleton />;

  const deltaText = formatKpiDelta(delta, deltaFormat);
  const showSpark = spark !== undefined && spark.length >= 2;

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-border/50 bg-card/30 p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
        <ImpactFlash watch={value}>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        </ImpactFlash>
        {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
        {deltaText && delta !== undefined ? (
          <KpiDeltaBadge delta={delta} deltaText={deltaText} invert={invert} />
        ) : null}
      </div>
      {showSpark ? (
        <div className="mt-0.5 w-full">
          <Sparkline data={[...spark]} color={sparkColor} />
        </div>
      ) : null}
    </div>
  );
}
