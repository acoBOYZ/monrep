import { Tabs, TabsList, TabsTrigger } from "@monrep/ui/base";
import type { MetricRange } from "@/components/agent/metrics/types";
import { RANGES } from "@/components/agent/metrics/types";

const RANGE_LABEL: Record<MetricRange, string> = {
  "30m": "30m",
  "1h": "1h",
  "6h": "6h",
  "24h": "24h",
};

type RangeTabsProps = {
  value: MetricRange;
  onChange: (value: MetricRange) => void;
};

export function RangeTabs({ value, onChange }: RangeTabsProps) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList size="sm">
        {RANGES.map((range) => (
          <TabsTrigger key={range} value={range}>
            {RANGE_LABEL[range]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
