import { CatalogueIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Badge,
  Button,
  CopyableButton,
  TableCell,
  TableRow,
  TooltipTrigger,
} from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { Link } from "@tanstack/react-router";
import type { DockerContainer } from "@/components/agent/utils/opsParse";
import { OpsActionsMenu } from "@/components/agent/ops/OpsActionsMenu";
import { dockerStateVariant } from "@/components/agent/utils/opsBadges";

type DockerContainerRowProps = {
  serverId: string;
  container: DockerContainer;
  disabled: boolean;
  onStart: (container: DockerContainer) => void;
  onStop: (container: DockerContainer) => void;
  onRestart: (container: DockerContainer) => void;
};

export function DockerContainerRow({
  serverId,
  container,
  disabled,
  onStart,
  onStop,
  onRestart,
}: DockerContainerRowProps) {
  const label = container.name || container.id;

  return (
    <TableRow className="h-10">
      <TableCell className="overflow-hidden font-medium">
        <span className="flex min-w-0 items-center gap-1">
          <TooltipTrigger content={label} className="min-w-0 flex-1">
            <span className="min-w-0 truncate">{label}</span>
          </TooltipTrigger>
          {container.id ? (
            <CopyableButton
              variant="inline"
              text={container.id}
              className="max-w-18 shrink-0 font-mono text-xs"
            />
          ) : null}
        </span>
      </TableCell>
      <TableCell className="truncate font-mono text-xs">
        <TooltipTrigger content={container.image} className="max-w-full min-w-0">
          <span className="truncate">{container.image}</span>
        </TooltipTrigger>
      </TableCell>
      <ImpactFlash
        watch={container.state}
        render={(p) => (
          <TableCell {...p}>
            <TooltipTrigger content={container.status}>
              <Badge variant={dockerStateVariant(container.state)} className="capitalize">
                {container.state}
              </Badge>
            </TooltipTrigger>
          </TableCell>
        )}
      />
      <TableCell className="truncate font-mono text-xs">
        {container.ports ? (
          <TooltipTrigger content={container.ports} className="max-w-full min-w-0">
            <span className="truncate">{container.ports}</span>
          </TooltipTrigger>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button
            nativeButton={false}
            size="sm"
            variant="outline"
            className="border-dashed"
            disabled={disabled}
            render={
              <Link
                to="/servers/$id/docker/$containerId"
                params={{ id: serverId, containerId: container.id }}
              />
            }
          >
            <HugeiconsIcon icon={CatalogueIcon} className="size-4" aria-hidden />
            Logs
          </Button>
          <OpsActionsMenu
            name={label}
            disabled={disabled}
            onStart={() => onStart(container)}
            onStop={() => onStop(container)}
            onRestart={() => onRestart(container)}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
