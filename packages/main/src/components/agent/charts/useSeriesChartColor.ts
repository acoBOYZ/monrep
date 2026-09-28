import { useMemo } from "react";
import { scaleOrdinal } from "@tanstack/charts/scales/ordinal";
import { SERIES_COLOR } from "./chartTheme";

/**
 * Ordinal series → palette color. The in-chart legend is intentionally off:
 * `ChartSeriesLegend` in the card header already lists series with live values.
 */
export function useSeriesChartColor(data: ReadonlyArray<{ series: string }>) {
  return useMemo(() => {
    const domain = [...new Set(data.map((d) => d.series))];
    return {
      scale: () =>
        scaleOrdinal<string, string>()
          .domain(domain)
          .range(domain.map((_, i) => SERIES_COLOR(i))),
    };
  }, [data]);
}
