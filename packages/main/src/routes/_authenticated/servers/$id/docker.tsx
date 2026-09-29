import { SearchInput } from "@monrep/ui/components";
import { createFileRoute } from "@tanstack/react-router";
import type { DockerContainer } from "@/components/agent/utils/opsParse";
import { DockerContainersTable } from "@/components/agent/docker/DockerContainersTable";
import { useDockerOpsPage } from "@/components/agent/docker/useDockerOpsPage";
import { EntityOpsChrome } from "@/components/agent/ops/EntityOpsChrome";
import { ServerDetailNotFound } from "@/components/agent/servers/ServerDetailNotFound";
import { ServerDetailSkeleton } from "@/components/agent/servers/ServerDetailSkeleton";

export const Route = createFileRoute("/_authenticated/servers/$id/docker")({
  component: ServerDockerPage,
});

function ServerDockerPage() {
  const { id } = Route.useParams();
  const ops = useDockerOpsPage(id);

  if (!ops.isReady) return <ServerDetailSkeleton />;
  if (!ops.server) return <ServerDetailNotFound />;

  const handleStart = (container: DockerContainer) => {
    ops.runVerb(["docker", "start", container.id], container.id, ops.refresh);
  };

  const handleStop = (container: DockerContainer) => {
    ops.runVerb(["docker", "stop", container.id], container.id, ops.refresh);
  };

  const handleRestart = (container: DockerContainer) => {
    ops.runVerb(["docker", "restart", container.id], container.id, ops.refresh);
  };

  return (
    <EntityOpsChrome
      layout="stack"
      serverId={id}
      serverName={ops.server.name}
      title="Docker"
      counts={ops.counts}
      online={ops.online}
      busy={ops.busy}
      error={ops.error}
      listError={ops.listError}
      onRefresh={ops.refresh}
      onCancel={ops.cancel}
      toolbar={
        <SearchInput
          className="max-w-xs"
          placeholder="Filter containers…"
          value={ops.filter}
          onValueChange={ops.setFilter}
          clearable
        />
      }
    >
      <DockerContainersTable
        serverId={id}
        items={ops.filtered}
        disabled={ops.disabled}
        loading={ops.loading || (ops.busy && ops.items.length === 0)}
        onStart={handleStart}
        onStop={handleStop}
        onRestart={handleRestart}
      />
    </EntityOpsChrome>
  );
}
