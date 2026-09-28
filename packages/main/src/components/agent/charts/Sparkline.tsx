import { useMemo } from "react";
import { areaY, defineChart, lineY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scaleUtc } from "d3-scale";
import { CHART_MOTION } from "./chartTheme";

type SparklineProps = {
  data: Array<{ id: string; at: Date; value: number }>;
  color: string;
};

export function Sparkline({ data, color }: SparklineProps) {
  const xDomain = useMemo((): [Date, Date] => {
    if (data.length === 0) return [new Date(0), new Date(1)];
    let min = data[0]?.at.getTime() ?? 0;
    let max = min;
    for (const row of data) {
      const t = row.at.getTime();
      if (t < min) min = t;
      if (t > max) max = t;
    }
    if (min === max) max += 1;
    return [new Date(min), new Date(max)];
  }, [data]);

  const definition = useMemo(
    () =>
      defineChart({
        ...CHART_MOTION,
        marks: [
          areaY(data, {
            x: "at",
            y: "value",
            key: "id",
            fill: color,
            fillOpacity: 0.12,
          }),
          lineY(data, {
            x: "at",
            y: "value",
            key: "id",
            stroke: color,
            strokeWidth: 1.5,
          }),
        ],
        scales: {
          x: { scale: () => scaleUtc().domain(xDomain), axis: false },
          y: { scale: scaleLinear, nice: true, axis: false },
        },
        guides: false,
        margin: 0,
      }),
    [color, data, xDomain],
  );

  return (
    <Chart definition={definition} height={40} ariaLabel="Sparkline trend" className="w-full" />
  );
}
