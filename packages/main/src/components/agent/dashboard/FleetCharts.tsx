import { useMemo } from "react";
import { useFleetSeries } from "./useFleetSeries";
import type { MetricPoint } from "@/components/agent/metrics/types";
import type { TServerDo } from "@/db/types";
import { ChartCard } from "@/components/agent/charts/ChartCard";
import { SeriesStatsTable } from "@/components/agent/charts/SeriesStatsTable";
import { TimeAreaChart } from "@/components/agent/charts/TimeAreaChart";
import { TimeLineChart } from "@/components/agent/charts/TimeLineChart";
import { memoryChartEmptyMessage } from "@/components/agent/metrics/memoryEmptyCopy";

type FleetChartsProps = {
  from: number;
  to: number;
  points: ReadonlyArray<MetricPoint>;
  servers: ReadonlyArray<TServerDo>;
};

export function FleetCharts({ from, to, points, servers }: FleetChartsProps) {
  const { loadSeries, memSeries } = useFleetSeries(points, servers);
  const memEmpty = useMemo(() => memoryChartEmptyMessage(points), [points]);
  const handleFormatSeriesValue = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ChartCard
        id="fleet-load"
        heading="Load average (1m)"
        caption={`${servers.length} servers`}
        series={loadSeries}
        renderChart={({ height }) => (
          <TimeLineChart
            data={loadSeries}
            from={from}
            to={to}
            height={height}
            yLabel="load"
            ariaLabel="Fleet load average one minute"
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
              ariaLabel="Fleet load average one minute expanded"
              emptyMessage="No load samples in range"
            />
            <SeriesStatsTable data={loadSeries} />
          </>
        }
      />
      <ChartCard
        id="fleet-mem"
        heading="Memory used"
        caption={`${servers.length} servers`}
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
            ariaLabel="Fleet memory used percent"
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
              ariaLabel="Fleet memory used percent expanded"
              emptyMessage={memEmpty}
            />
            <SeriesStatsTable data={memSeries} />
          </>
        }
      />
    </div>
  );
}
