import { Badge, CopyableButton, TooltipTrigger } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { DockerLogsPanel } from "./DockerLogsPanel";
import type { DockerContainerLogsOps } from "./useDockerContainerLogs";
import { OpsActionsMenu } from "@/components/agent/ops/OpsActionsMenu";
import { dockerStateVariant } from "@/components/agent/utils/opsBadges";

type DockerContainerLogsPageProps = {
  containerId: string;
  ops: DockerContainerLogsOps;
};

export function DockerContainerLogsPage({ containerId, ops }: DockerContainerLogsPageProps) {
  const container = ops.container;
  const label = container?.name || containerId;
  const disabled = !ops.online || ops.busy;

  const afterVerb = () => {
    ops.refreshLogs();
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {container ? (
            <ImpactFlash watch={container.state} className="shrink-0">
              <TooltipTrigger content={container.status}>
                <Badge variant={dockerStateVariant(container.state)} className="capitalize">
                  {container.state}
                </Badge>
              </TooltipTrigger>
            </ImpactFlash>
          ) : null}
          <CopyableButton variant="inline" text={containerId} className="font-mono text-xs" />
          {container?.image ? (
            <TooltipTrigger content={container.image} className="max-w-full min-w-0">
              <span className="truncate font-mono text-xs text-muted-foreground">
                {container.image}
              </span>
            </TooltipTrigger>
          ) : null}
          {!ops.online ? (
            <Badge variant="muted" className="shrink-0">
              Agent offline
            </Badge>
          ) : null}
        </div>
        <div className="ms-auto shrink-0">
          <OpsActionsMenu
            name={label}
            disabled={disabled}
            onStart={() => ops.runVerb(["docker", "start", containerId], afterVerb)}
            onStop={() => ops.runVerb(["docker", "stop", containerId], afterVerb)}
            onRestart={() => ops.runVerb(["docker", "restart", containerId], afterVerb)}
          />
        </div>
      </div>
      <DockerLogsPanel
        className="min-h-0 flex-1"
        title={label}
        subtitle={containerId.slice(0, 12)}
        lines={ops.lines}
        busy={ops.busy}
        tail={ops.tail}
        onTailChange={ops.setTail}
      />
    </div>
  );
}
