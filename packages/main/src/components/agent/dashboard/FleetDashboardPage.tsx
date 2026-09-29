import { FleetHeader } from "./FleetHeader";
import { FleetKpis } from "./FleetKpis";
import { FleetTable } from "./FleetTable";
import { useFleetMetrics } from "@/components/agent/metrics/useFleetMetrics";
import { useMetricRange } from "@/components/agent/metrics/useMetricRange";

export function FleetDashboardPage() {
  const { range, setRange, from, to } = useMetricRange();
  const fleet = useFleetMetrics(from, to);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
      <FleetHeader
        online={fleet.counts.online}
        offline={fleet.counts.offline}
        pending={fleet.counts.pending}
        range={range}
        onRangeChange={setRange}
      />
      <FleetKpis
        loading={!fleet.isReady}
        online={fleet.counts.online}
        total={fleet.counts.total}
        kpis={fleet.kpis}
      />
      <FleetTable
        servers={fleet.servers}
        isReady={fleet.isReady}
        latest={fleet.latest}
        errors={fleet.errors}
      />
    </main>
  );
}
