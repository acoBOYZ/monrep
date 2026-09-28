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
    <section
      aria-label={heading}
      className="group flex min-w-0 flex-col gap-3 rounded-lg border border-border/60 bg-card/40 p-3 transition-colors hover:bg-card/60"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3 className="text-sm font-semibold">{heading}</h3>
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
          className="size-7 shrink-0 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
          aria-label={`Expand ${heading} chart`}
          onClick={openDialog}
        >
          <HugeiconsIcon icon={ExpandIcon} className="size-4" aria-hidden />
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
