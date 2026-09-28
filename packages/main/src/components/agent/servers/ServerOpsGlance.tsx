import { Activity01Icon, ContainerIcon, Database01Icon } from "@hugeicons/core-free-icons";
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
    <div className="grid gap-3 sm:grid-cols-3">
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
  );
}
