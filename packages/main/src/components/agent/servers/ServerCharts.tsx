import { useMemo } from "react";
import type { MetricPoint } from "@/components/agent/metrics/types";
import { ChartCard } from "@/components/agent/charts/ChartCard";
import { SeriesStatsTable } from "@/components/agent/charts/SeriesStatsTable";
import { TimeAreaChart } from "@/components/agent/charts/TimeAreaChart";
import { TimeLineChart } from "@/components/agent/charts/TimeLineChart";
import { toSeries } from "@/components/agent/metrics/aggregate";
import { memoryChartEmptyMessage } from "@/components/agent/metrics/memoryEmptyCopy";

type ServerChartsProps = {
  serverId: string;
  from: number;
  to: number;
  points: ReadonlyArray<MetricPoint>;
};

export function ServerCharts({ serverId, from, to, points }: ServerChartsProps) {
  const loadSeries = useMemo(
    () => [
      ...toSeries(points, "load1", () => "1m"),
      ...toSeries(points, "load5", () => "5m"),
      ...toSeries(points, "load15", () => "15m"),
    ],
    [points],
  );
  const memSeries = useMemo(() => toSeries(points, "memPct", () => "mem"), [points]);
  const memEmpty = useMemo(() => memoryChartEmptyMessage(points), [points]);
  const handleFormatSeriesValue = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ChartCard
        id={`srv-${serverId}-load`}
        heading="Load average"
        caption="1m · 5m · 15m"
        series={loadSeries}
        renderChart={({ height }) => (
          <TimeLineChart
            data={loadSeries}
            from={from}
            to={to}
            height={height}
            yLabel="load"
            ariaLabel="Server load averages"
            emptyMessage="No load samples in range"
          />
        )}
        expanded={
          <>
            <TimeLineChart
              data={loadSeries}
              from={from}
              to={to}
              height={420}
              yLabel="load"
              ariaLabel="Server load averages expanded"
              emptyMessage="No load samples in range"
            />
            <SeriesStatsTable data={loadSeries} />
          </>
        }
      />
      <ChartCard
        id={`srv-${serverId}-mem`}
        heading="Memory used"
        caption="% of total RAM"
        series={memSeries}
        formatSeriesValue={handleFormatSeriesValue}
        renderChart={({ height }) => (
          <TimeAreaChart
            data={memSeries}
            from={from}
            to={to}
            height={height}
            yLabel="%"
            yDomain={[0, 100]}
            ariaLabel="Server memory used percent"
            emptyMessage={memEmpty}
          />
        )}
        expanded={
          <>
            <TimeAreaChart
              data={memSeries}
              from={from}
              to={to}
              height={420}
              yLabel="%"
              yDomain={[0, 100]}
              ariaLabel="Server memory used percent expanded"
              emptyMessage={memEmpty}
            />
            <SeriesStatsTable data={memSeries} />
          </>
        }
      />
    </div>
  );
}
