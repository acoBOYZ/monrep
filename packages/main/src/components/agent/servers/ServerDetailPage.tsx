import { useMemo } from "react";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { ServerCharts } from "./ServerCharts";
import { ServerDetailHeader } from "./ServerDetailHeader";
import { ServerDetailNotFound } from "./ServerDetailNotFound";
import { ServerDetailSkeleton } from "./ServerDetailSkeleton";
import { ServerKpiStrip } from "./ServerKpiStrip";
import { ServerMetaRow } from "./ServerMetaRow";
import { ServerMetricsToolbar } from "./ServerMetricsToolbar";
import { ServerOpsGlance } from "./ServerOpsGlance";
import { SortableSectionList } from "./layout/SortableSectionList";
import { useServerLayout } from "./layout/useServerLayout";
import type { ReactNode } from "react";
import type { ServerSectionId } from "./layout/sectionIds";
import { useMetricRange } from "@/components/agent/metrics/useMetricRange";
import { useServerMetrics } from "@/components/agent/metrics/useServerMetrics";
import { AgentPty } from "@/components/agent/ops/AgentPty";
import { PendingServerPage } from "@/components/agent/pending/PendingServerPage";
import { useStreamDb } from "@/db/useStreamDb";

type ServerDetailPageProps = {
  serverId: string;
};

export function ServerDetailPage({ serverId: id }: ServerDetailPageProps) {
  const { range, setRange, from, to } = useMetricRange();
  const { db, isReady } = useStreamDb("agent");
  const metrics = useServerMetrics(id, from, to);
  const { order, setOrder } = useServerLayout(id);
  const { data: server } = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q
        .from({ s: db.collections.server })
        .where(({ s }) => eq(s.id, id))
        .findOne();
    },
  });

  const online = server?.status === "online";

  const sections = useMemo((): Record<ServerSectionId, ReactNode> => {
    if (!server?.id) {
      return { meta: null, metrics: null, ops: null, pty: null };
    }
    return {
      meta: (
        <ServerMetaRow
          serverId={id}
          agentVersion={server.agentVersion}
          serverDeviceId={server.deviceId}
          serverLastSeenAt={server.lastSeenAt}
          latest={metrics.latest}
        />
      ),
      metrics: (
        <div className="flex flex-col gap-3">
          <ServerMetricsToolbar range={range} onRangeChange={setRange} />
          <ServerKpiStrip
            loading={!metrics.isReady}
            latest={metrics.latest}
            points={metrics.points}
            prevPoints={metrics.prevPoints}
            errors={metrics.errors}
            kpis={metrics.kpis}
          />
          <ServerCharts serverId={id} from={from} to={to} points={metrics.points} />
        </div>
      ),
      ops: <ServerOpsGlance serverId={id} online={online} health={metrics.health} />,
      pty: <AgentPty serverId={id} online={online} />,
    };
  }, [from, id, metrics, online, range, server, setRange, to]);

  if (!isReady) return <ServerDetailSkeleton />;
  if (!server || !server.id) return <ServerDetailNotFound />;
  if (server.status === "pending")
    return <PendingServerPage serverId={id} name={server.name} createdAt={server.createdAt} />;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-3 overflow-visible px-4 py-6 sm:px-6">
      <ServerDetailHeader server={server} serverId={id} online={online} />
      <SortableSectionList order={order} sections={sections} onReorder={setOrder} />
    </main>
  );
}
