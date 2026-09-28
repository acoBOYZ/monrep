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
    <ul className="flex flex-wrap items-center gap-1.5" aria-label="Series">
      {rows.map((row, i) => (
        <li
          key={row.name}
          className="inline-flex items-center gap-1.5 rounded-md bg-muted/40 px-1.5 py-0.5 text-xs"
        >
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: SERIES_COLOR(i) }}
            aria-hidden
          />
          <span className="text-muted-foreground">{row.name}</span>
          <span className="font-mono font-medium tabular-nums">
            {row.latest !== undefined ? formatValue(row.latest) : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}
