import { ViewTransition } from "react";
import { ExpandIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@monrep/ui/base";
import { ChartExpandDialog } from "./ChartExpandDialog";
import { ChartSeriesLegend } from "./ChartSeriesLegend";
import { useChartExpand } from "./useChartExpand";
import type { ReactNode } from "react";
import type { SeriesPoint } from "./seriesStats";

const CARD_CHART_HEIGHT = 200;

type ChartCardProps = {
  id: string;
  heading: string;
  caption?: string;
  series?: ReadonlyArray<SeriesPoint>;
  formatSeriesValue?: (value: number) => string;
  renderChart: (opts: { height: number }) => ReactNode;
  expanded: ReactNode;
};

export function ChartCard({
  id,
  heading,
  caption,
  series,
  formatSeriesValue,
  renderChart,
  expanded,
}: ChartCardProps) {
  const { open, openDialog, closeDialog } = useChartExpand();
  const transitionName = `chart-${id}`;
  const hasSeries = series !== undefined && series.length > 0;

  return (
    <section className="flex flex-col gap-2 rounded-md border border-border/50 bg-card/30 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3 className="text-sm font-medium">{heading}</h3>
            {caption ? (
              <span className="font-mono text-[11px] text-muted-foreground">{caption}</span>
            ) : null}
          </div>
          {hasSeries ? <ChartSeriesLegend data={series} formatValue={formatSeriesValue} /> : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          aria-label="Expand chart"
          onClick={openDialog}
        >
          <HugeiconsIcon icon={ExpandIcon} className="size-5" aria-hidden />
        </Button>
      </div>
      {open ? (
        <div aria-hidden style={{ height: CARD_CHART_HEIGHT }} />
      ) : (
        <ViewTransition name={transitionName} share="chart-share">
          {renderChart({ height: CARD_CHART_HEIGHT })}
        </ViewTransition>
      )}
      <ChartExpandDialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeDialog();
        }}
        heading={heading}
        description={caption}
      >
        <ViewTransition name={transitionName} share="chart-share">
          {expanded}
        </ViewTransition>
      </ChartExpandDialog>
    </section>
  );
}
