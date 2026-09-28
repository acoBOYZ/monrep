import type { MetricRange } from "@/components/agent/metrics/types";
import { RangeTabs } from "@/components/agent/charts/RangeTabs";

type ServerMetricsToolbarProps = {
  range: MetricRange;
  onRangeChange: (value: MetricRange) => void;
};

export function ServerMetricsToolbar({ range, onRangeChange }: ServerMetricsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-sm font-medium">Metrics</h2>
      <RangeTabs value={range} onChange={onRangeChange} />
    </div>
  );
}
