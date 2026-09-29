import { Analytics01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { MetricRange } from "@/components/agent/metrics/types";
import { RangeTabs } from "@/components/agent/charts/RangeTabs";

type ServerMetricsToolbarProps = {
  range: MetricRange;
  onRangeChange: (value: MetricRange) => void;
};

export function ServerMetricsToolbar({ range, onRangeChange }: ServerMetricsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
          <HugeiconsIcon icon={Analytics01Icon} className="size-6 text-cool" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Metrics</h2>
          <p className="truncate text-xs text-muted-foreground">
            Last {range} · deltas vs the previous {range}
          </p>
        </div>
      </div>
      <div className="ms-auto shrink-0">
        <RangeTabs value={range} onChange={onRangeChange} />
      </div>
    </div>
  );
}
