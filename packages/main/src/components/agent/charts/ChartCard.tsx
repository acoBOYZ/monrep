import { ViewTransition } from "react";
import { ArrowExpand01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, TooltipTrigger } from "@monrep/ui/base";
import { ChartExpandDialog } from "./ChartExpandDialog";
import { useChartExpand } from "./useChartExpand";
import type { ReactNode } from "react";

const CARD_CHART_HEIGHT = 200;

type ChartCardProps = {
  id: string;
  heading: string;
  caption?: string;
  latest?: string;
  renderChart: (opts: { height: number }) => ReactNode;
  expanded: ReactNode;
};

export function ChartCard({ id, heading, caption, latest, renderChart, expanded }: ChartCardProps) {
  const { open, openDialog, closeDialog } = useChartExpand();
  const transitionName = `chart-${id}`;

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">{heading}</h3>
          {caption ? (
            <span className="font-mono text-xs text-muted-foreground">{caption}</span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {latest ? <span className="font-mono text-sm tabular-nums">{latest}</span> : null}
          <TooltipTrigger content="Expand">
            <Button
              type="button"
              variant="ghost"
              size="iconxs"
              aria-label="Expand chart"
              onClick={openDialog}
            >
              <HugeiconsIcon icon={ArrowExpand01Icon} className="size-4" aria-hidden />
            </Button>
          </TooltipTrigger>
        </div>
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
