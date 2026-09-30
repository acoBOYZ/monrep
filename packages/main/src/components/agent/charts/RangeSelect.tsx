import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@monrep/ui/base";
import type { MetricRange } from "@/components/agent/metrics/types";
import { RANGES } from "@/components/agent/metrics/types";

const RANGE_LABEL: Record<MetricRange, string> = {
  "30m": "30m",
  "1h": "1h",
  "6h": "6h",
  "24h": "24h",
  "7d": "7d",
  "30d": "30d",
};

type RangeSelectProps = {
  value: MetricRange;
  onChange: (value: MetricRange) => void;
};

export function RangeSelect({ value, onChange }: RangeSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label="Metrics range" className="h-8 w-19 px-2 text-xs">
        <SelectValue>{RANGE_LABEL[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false} className="min-w-19">
        {RANGES.map((range) => (
          <SelectItem key={range} value={range} label={RANGE_LABEL[range]}>
            {RANGE_LABEL[range]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
