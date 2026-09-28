import {
  Activity01Icon,
  ContainerIcon,
  Database01Icon,
  Settings03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { HealthEvent } from "@/components/agent/metrics/types";
import { useOpsGlance } from "@/components/agent/hooks/useOpsGlance";
import { OpsGlanceTile } from "@/components/agent/ops/OpsGlanceTile";
import {
  dockerDetail,
  healthGlanceFromEvents,
  servicesDetail,
} from "@/components/agent/utils/opsGlanceDetail";
import { dockerGlanceBadge, servicesGlanceBadge } from "@/components/agent/utils/opsGlanceLabels";

type ServerOpsGlanceProps = {
  serverId: string;
  online: boolean;
  health: ReadonlyArray<HealthEvent>;
};

export function ServerOpsGlance({ serverId, online, health }: ServerOpsGlanceProps) {
  const { dockerBad, dockerTotal, servicesFailed, scanning } = useOpsGlance(serverId, online);
  const docker = dockerGlanceBadge(online, scanning, dockerBad);
  const services = servicesGlanceBadge(online, scanning, servicesFailed);
  const healthGlance = healthGlanceFromEvents(health);

  return (
    <section aria-labelledby="server-ops-heading" className="flex flex-col gap-3 pt-2">
      <div className="flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
          <HugeiconsIcon icon={Settings03Icon} className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="server-ops-heading" className="text-sm font-semibold">
            Operations
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            Containers, systemd units and agent health
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <OpsGlanceTile
          label="Docker"
          detail={dockerDetail(dockerTotal, dockerBad, online)}
          icon={ContainerIcon}
          to="/servers/$id/docker"
          params={{ id: serverId }}
          watch={dockerBad ?? "scan"}
          badgeVariant={docker.variant}
          badgeLabel={docker.label}
        />
        <OpsGlanceTile
          label="Services"
          detail={servicesDetail(servicesFailed, online)}
          icon={Database01Icon}
          to="/servers/$id/services"
          params={{ id: serverId }}
          watch={servicesFailed ?? "scan"}
          badgeVariant={services.variant}
          badgeLabel={services.label}
        />
        <OpsGlanceTile
          label="Health"
          detail={healthGlance.detail}
          icon={Activity01Icon}
          to="/dashboard"
          watch={healthGlance.watch}
          badgeVariant={healthGlance.badgeVariant}
          badgeLabel={healthGlance.badgeLabel}
        />
      </div>
    </section>
  );
}
