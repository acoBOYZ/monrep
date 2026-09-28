import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@monrep/ui/base";
import { Link } from "@tanstack/react-router";
import { DockerLogsPanel } from "./DockerLogsPanel";
import type { DockerContainerLogsOps } from "./useDockerContainerLogs";
import { OpsActionsMenu } from "@/components/agent/ops/OpsActionsMenu";

type DockerContainerLogsPageProps = {
  serverId: string;
  containerId: string;
  ops: DockerContainerLogsOps;
};

export function DockerContainerLogsPage({
  serverId,
  containerId,
  ops,
}: DockerContainerLogsPageProps) {
  const label = ops.container?.name || containerId;
  const disabled = !ops.online || ops.busy;

  const afterVerb = () => {
    ops.refreshLogs();
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button
            nativeButton={false}
            variant="ghost"
            size="sm"
            render={<Link to="/servers/$id/docker" params={{ id: serverId }} />}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" aria-hidden />
            Docker
          </Button>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {containerId.slice(0, 12)}
          </p>
        </div>
        <OpsActionsMenu
          name={label}
          disabled={disabled}
          onStart={() => ops.runVerb(["docker", "start", containerId], afterVerb)}
          onStop={() => ops.runVerb(["docker", "stop", containerId], afterVerb)}
          onRestart={() => ops.runVerb(["docker", "restart", containerId], afterVerb)}
        />
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
