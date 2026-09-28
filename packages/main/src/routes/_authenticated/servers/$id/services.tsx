import { SearchInput } from "@monrep/ui/components";
import { createFileRoute } from "@tanstack/react-router";
import { EntityOpsChrome } from "@/components/agent/ops/EntityOpsChrome";
import { OpsOutputPanel } from "@/components/agent/ops/OpsOutputPanel";
import { ServerDetailNotFound } from "@/components/agent/servers/ServerDetailNotFound";
import { ServerDetailSkeleton } from "@/components/agent/servers/ServerDetailSkeleton";
import { ServicesUnitsTable } from "@/components/agent/services/ServicesUnitsTable";
import { useServicesOpsPage } from "@/components/agent/services/useServicesOpsPage";

export const Route = createFileRoute("/_authenticated/servers/$id/services")({
  component: ServerServicesPage,
});

function ServerServicesPage() {
  const { id } = Route.useParams();
  const ops = useServicesOpsPage(id);

  if (!ops.isReady) return <ServerDetailSkeleton />;
  if (!ops.server) return <ServerDetailNotFound />;

  return (
    <EntityOpsChrome
      serverId={id}
      serverName={ops.server.name}
      title="Services"
      counts={ops.counts}
      online={ops.online}
      busy={ops.busy}
      error={ops.error}
      listError={ops.listError}
      listErrorVariant={ops.listErrorVariant}
      onRefresh={ops.refresh}
      onCancel={ops.cancel}
      toolbar={
        <SearchInput
          className="max-w-xs"
          placeholder="Filter units…"
          value={ops.filter}
          onValueChange={ops.setFilter}
        />
      }
    >
      <ServicesUnitsTable
        items={ops.filtered}
        selectedKey={ops.selectedKey}
        disabled={ops.disabled}
        loading={ops.loading || (ops.busy && ops.items.length === 0)}
        onSelect={ops.select}
        onStatus={(u) =>
          ops.runAndShow(["systemctl", "status", u.unit, "--no-pager", "-l"], u.unit)
        }
        onLogs={(u) =>
          ops.runAndShow(["journalctl", "-u", u.unit, "-n", "200", "--no-pager"], u.unit)
        }
        onStart={(u) => ops.runVerb(["systemctl", "start", u.unit], u.unit, ops.refresh)}
        onStop={(u) => ops.runVerb(["systemctl", "stop", u.unit], u.unit, ops.refresh)}
        onRestart={(u) => ops.runVerb(["systemctl", "restart", u.unit], u.unit, ops.refresh)}
      />
      <OpsOutputPanel title={ops.selected?.unit} output={ops.output} busy={ops.busy} />
    </EntityOpsChrome>
  );
}
