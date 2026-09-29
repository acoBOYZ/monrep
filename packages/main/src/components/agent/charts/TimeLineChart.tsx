import { useMemo } from "react";
import { cn } from "@monrep/utils";
import { defineChart, lineY } from "@tanstack/charts";
import { crosshair } from "@tanstack/charts/crosshair";
import { Chart } from "@tanstack/charts/react";
import { ChartEmpty } from "./ChartEmpty";
import { CHART_MOTION, CHART_PALETTE_CLASS, chartTooltip, timeAxis, valueAxis } from "./chartTheme";
import { useSeriesChartColor } from "./useSeriesChartColor";

type TimeLineChartProps = {
  data: Array<{ id: string; at: Date; value: number; series: string }>;
  from: number;
  to: number;
  height: number;
  yLabel: string;
  yDomain?: [number, number];
  formatValue?: (n: number) => string;
  ariaLabel: string;
  emptyMessage?: string;
};

export function TimeLineChart({
  data,
  from,
  to,
  height,
  yLabel,
  yDomain,
  formatValue,
  ariaLabel,
  emptyMessage,
}: TimeLineChartProps) {
  const seriesColor = useSeriesChartColor(data);

  const definition = useMemo(() => {
    if (data.length < 2) return null;
    return defineChart({
      ...CHART_MOTION,
      marks: [
        lineY(data, {
          x: "at",
          y: "value",
          z: "series",
          key: "id",
          strokeWidth: 2,
        }),
        crosshair({ x: { label: true }, y: false }),
      ],
      scales: {
        x: timeAxis(from, to),
        y: valueAxis(yLabel, yDomain),
      },
      color: {
        scale: seriesColor.scale,
      },
      tooltip: chartTooltip(yLabel, formatValue),
    });
  }, [data, formatValue, from, seriesColor, to, yDomain, yLabel]);

  if (!definition) {
    return (
      <div className={cn("w-full", CHART_PALETTE_CLASS)}>
        <ChartEmpty height={height} message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={cn("w-full", CHART_PALETTE_CLASS)}>
      <Chart definition={definition} height={height} ariaLabel={ariaLabel} />
    </div>
  );
}
