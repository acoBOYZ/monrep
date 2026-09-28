import { HugeiconsIcon } from "@hugeicons/react";
import { ImpactFlash } from "@monrep/ui/func";
import { KpiDeltaBadge } from "./KpiDeltaBadge";
import { KpiTileSkeleton } from "./KpiTileSkeleton";
import { formatKpiDelta } from "./kpiTile.helpers";
import type { IconSvgElement } from "@hugeicons/react";
import { Sparkline } from "@/components/agent/charts/Sparkline";

type SparkPoint = { id: string; at: Date; value: number };

type KpiTileProps = {
  label: string;
  value: string;
  unit?: string;
  icon?: IconSvgElement;
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
  icon,
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
    <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border/60 bg-card/40 transition-colors hover:bg-card/60">
      <div className="flex flex-col gap-2 px-3 pt-3 pb-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon ? (
            <HugeiconsIcon
              icon={icon}
              className="size-3.5 shrink-0"
              style={{ color: sparkColor }}
              aria-hidden
            />
          ) : null}
          <span className="truncate">{label}</span>
        </div>
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <ImpactFlash watch={value}>
            <span className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {value}
            </span>
          </ImpactFlash>
          {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
          {deltaText && delta !== undefined ? (
            <KpiDeltaBadge delta={delta} deltaText={deltaText} invert={invert} />
          ) : null}
        </div>
      </div>
      {showSpark ? (
        <div className="mt-auto w-full">
          <Sparkline data={[...spark]} color={sparkColor} />
        </div>
      ) : null}
    </div>
  );
}
