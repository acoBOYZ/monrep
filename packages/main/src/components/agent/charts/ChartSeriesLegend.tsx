import { useMemo } from "react";
import { SERIES_COLOR } from "./chartTheme";
import { seriesStats } from "./seriesStats";
import type { SeriesPoint } from "./seriesStats";

type ChartSeriesLegendProps = {
  data: ReadonlyArray<SeriesPoint>;
  formatValue?: (value: number) => string;
};

const defaultFormat = (value: number) => value.toFixed(2);

export function ChartSeriesLegend({ data, formatValue = defaultFormat }: ChartSeriesLegendProps) {
  const rows = useMemo(() => seriesStats(data), [data]);
  if (rows.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {rows.map((row, i) => (
        <li key={row.name} className="flex items-baseline gap-1.5 text-xs">
          <span
            className="mt-0.5 size-2 shrink-0 rounded-full"
            style={{ backgroundColor: SERIES_COLOR(i) }}
            aria-hidden
          />
          <span className="text-muted-foreground">{row.name}</span>
          <span className="font-mono tabular-nums">
            {row.latest !== undefined ? formatValue(row.latest) : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}
