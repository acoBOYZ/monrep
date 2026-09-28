import { useMemo } from "react";
import { colorLegend } from "@tanstack/charts";
import { scaleOrdinal } from "@tanstack/charts/scales/ordinal";
import { SERIES_COLOR } from "./chartTheme";

export function useSeriesChartColor(data: ReadonlyArray<{ series: string }>) {
  return useMemo(() => {
    const domain = [...new Set(data.map((d) => d.series))].sort();
    return {
      scale: () =>
        scaleOrdinal<string, string>()
          .domain(domain)
          .range(domain.map((_, i) => SERIES_COLOR(i))),
      legend: domain.length > 1 ? colorLegend({ label: "" }) : undefined,
    };
  }, [data]);
}
