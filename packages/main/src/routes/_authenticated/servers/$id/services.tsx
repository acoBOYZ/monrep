import { SearchInput } from "@monrep/ui/components";
import { createFileRoute } from "@tanstack/react-router";
import type { SystemdUnit } from "@/components/agent/utils/opsParse";
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

  const handleStatus = (unit: SystemdUnit) => {
    ops.runAndShow(["systemctl", "status", unit.unit, "--no-pager", "-l"], unit.unit);
  };

  const handleLogs = (unit: SystemdUnit) => {
    ops.runAndShow(["journalctl", "-u", unit.unit, "-n", "200", "--no-pager"], unit.unit);
  };

  const handleStart = (unit: SystemdUnit) => {
    ops.runVerb(["systemctl", "start", unit.unit], unit.unit, ops.refresh);
  };

  const handleStop = (unit: SystemdUnit) => {
    ops.runVerb(["systemctl", "stop", unit.unit], unit.unit, ops.refresh);
  };

  const handleRestart = (unit: SystemdUnit) => {
    ops.runVerb(["systemctl", "restart", unit.unit], unit.unit, ops.refresh);
  };

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
          className="w-full max-w-md"
          placeholder="Filter units…"
          value={ops.filter}
          onValueChange={ops.setFilter}
          clearable
        />
      }
    >
      <ServicesUnitsTable
        items={ops.filtered}
        selectedKey={ops.selectedKey}
        disabled={ops.disabled}
        loading={ops.loading || (ops.busy && ops.items.length === 0)}
        onSelect={ops.select}
        onStatus={handleStatus}
        onLogs={handleLogs}
        onStart={handleStart}
        onStop={handleStop}
        onRestart={handleRestart}
      />
      <OpsOutputPanel
        className="min-h-0 flex-1"
        title={ops.selected?.unit}
        output={ops.output}
        busy={ops.busy}
      />
    </EntityOpsChrome>
  );
}
