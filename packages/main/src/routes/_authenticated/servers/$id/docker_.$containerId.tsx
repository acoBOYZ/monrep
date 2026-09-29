import { createFileRoute } from "@tanstack/react-router";
import { DockerContainerLogsPage } from "@/components/agent/docker/DockerContainerLogsPage";
import { useDockerContainerLogs } from "@/components/agent/docker/useDockerContainerLogs";
import { EntityOpsChrome } from "@/components/agent/ops/EntityOpsChrome";
import { ServerDetailNotFound } from "@/components/agent/servers/ServerDetailNotFound";
import { ServerDetailSkeleton } from "@/components/agent/servers/ServerDetailSkeleton";

export const Route = createFileRoute("/_authenticated/servers/$id/docker_/$containerId")({
  component: ServerDockerContainerLogsPage,
});

function ServerDockerContainerLogsPage() {
  const { id, containerId } = Route.useParams();
  const ops = useDockerContainerLogs(id, containerId);

  if (!ops.isReady) return <ServerDetailSkeleton />;
  if (!ops.server) return <ServerDetailNotFound />;

  const label = ops.container?.name ?? containerId;
  return (
    <EntityOpsChrome
      serverId={id}
      serverName={ops.server.name}
      title={label}
      crumbs={[{ label: "Docker", to: "/servers/$id/docker", params: { id } }]}
      counts={{ total: 0, totalLabel: "containers", bad: 0, badLabel: "not running" }}
      online={ops.online}
      busy={ops.busy}
      error={ops.error}
      listError={null}
      onRefresh={ops.refreshLogs}
      onCancel={ops.cancel}
    >
      <DockerContainerLogsPage containerId={containerId} ops={ops} />
    </EntityOpsChrome>
  );
}
