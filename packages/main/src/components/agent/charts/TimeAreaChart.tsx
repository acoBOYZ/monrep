import { useMemo } from "react";
import { cn } from "@monrep/utils";
import { areaY, defineChart, lineY } from "@tanstack/charts";
import { crosshair } from "@tanstack/charts/crosshair";
import { Chart } from "@tanstack/charts/react";
import { tooltip } from "@tanstack/charts/tooltip";
import { ChartEmpty } from "./ChartEmpty";
import { CHART_MOTION, CHART_PALETTE_CLASS, timeAxis, valueAxis } from "./chartTheme";
import { useSeriesChartColor } from "./useSeriesChartColor";

type TimeAreaChartProps = {
  data: Array<{ id: string; at: Date; value: number; series: string }>;
  from: number;
  to: number;
  height: number;
  yLabel: string;
  yDomain?: [number, number];
  ariaLabel: string;
  emptyMessage?: string;
};

export function TimeAreaChart({
  data,
  from,
  to,
  height,
  yLabel,
  yDomain,
  ariaLabel,
  emptyMessage,
}: TimeAreaChartProps) {
  const seriesColor = useSeriesChartColor(data);

  const definition = useMemo(() => {
    if (data.length < 2) return null;
    return defineChart({
      ...CHART_MOTION,
      marks: [
        areaY(data, {
          x: "at",
          y: "value",
          z: "series",
          key: "id",
          fillOpacity: 0.12,
        }),
        lineY(data, {
          x: "at",
          y: "value",
          z: "series",
          key: "id",
          strokeWidth: 1.5,
        }),
        crosshair({ x: { label: true }, y: false }),
      ],
      scales: {
        x: timeAxis(from, to),
        y: valueAxis(yLabel, yDomain),
      },
      color: {
        scale: seriesColor.scale,
        legend: seriesColor.legend,
      },
      tooltip,
    });
  }, [data, from, seriesColor, to, yDomain, yLabel]);

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
