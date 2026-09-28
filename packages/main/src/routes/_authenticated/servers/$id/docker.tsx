import { SearchInput } from "@monrep/ui/components";
import { createFileRoute } from "@tanstack/react-router";
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
        />
      }
    >
      <DockerContainersTable
        serverId={id}
        items={ops.filtered}
        disabled={ops.disabled}
        loading={ops.loading || (ops.busy && ops.items.length === 0)}
        onStart={(c) => ops.runVerb(["docker", "start", c.id], c.id, ops.refresh)}
        onStop={(c) => ops.runVerb(["docker", "stop", c.id], c.id, ops.refresh)}
        onRestart={(c) => ops.runVerb(["docker", "restart", c.id], c.id, ops.refresh)}
      />
    </EntityOpsChrome>
  );
}
