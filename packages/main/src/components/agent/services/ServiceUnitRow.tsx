import { File02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge, Button, TableCell, TableRow, TooltipTrigger } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import type { SystemdUnit } from "@/components/agent/utils/opsParse";
import { OpsActionsMenu } from "@/components/agent/ops/OpsActionsMenu";
import { unitStateVariant } from "@/components/agent/utils/opsBadges";

type ServiceUnitRowProps = {
  unit: SystemdUnit;
  selected: boolean;
  disabled: boolean;
  onSelect: (unit: string) => void;
  onStatus: (unit: SystemdUnit) => void;
  onLogs: (unit: SystemdUnit) => void;
  onStart: (unit: SystemdUnit) => void;
  onStop: (unit: SystemdUnit) => void;
  onRestart: (unit: SystemdUnit) => void;
};

function activeLabel(u: SystemdUnit): string {
  if (u.active && u.sub && u.active !== u.sub) return `${u.active}/${u.sub}`;
  return u.sub || u.active || "—";
}

export function ServiceUnitRow({
  unit,
  selected,
  disabled,
  onSelect,
  onStatus,
  onLogs,
  onStart,
  onStop,
  onRestart,
}: ServiceUnitRowProps) {
  const stateKey = `${unit.active}/${unit.sub}`;

  return (
    <TableRow
      className="h-10 cursor-pointer"
      data-state={selected ? "selected" : undefined}
      onClick={() => onSelect(unit.unit)}
    >
      <TableCell className="max-w-0 overflow-hidden font-mono text-xs font-medium">
        <TooltipTrigger content={unit.unit} className="block max-w-full min-w-0">
          <span className="block truncate">{unit.unit}</span>
        </TooltipTrigger>
      </TableCell>
      <ImpactFlash
        watch={stateKey}
        render={(p) => (
          <TableCell {...p} className="max-w-0 overflow-hidden">
            <TooltipTrigger content={stateKey} className="block max-w-full min-w-0">
              <Badge
                variant={unitStateVariant(unit.active, unit.sub)}
                className="max-w-full truncate"
              >
                {activeLabel(unit)}
              </Badge>
            </TooltipTrigger>
          </TableCell>
        )}
      />
      <TableCell className="hidden max-w-0 overflow-hidden text-muted-foreground md:table-cell">
        <TooltipTrigger content={unit.description || "—"} className="block max-w-full min-w-0">
          <span className="block truncate text-sm">{unit.description || "—"}</span>
        </TooltipTrigger>
      </TableCell>
      <TableCell className="overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-0.5">
          <TooltipTrigger content="Logs">
            <Button
              type="button"
              size="iconxs"
              variant="ghost"
              disabled={disabled}
              aria-label="Logs"
              onClick={() => onLogs(unit)}
            >
              <HugeiconsIcon icon={File02Icon} className="size-3.5" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipTrigger content="Status">
            <Button
              type="button"
              size="iconxs"
              variant="ghost"
              disabled={disabled}
              aria-label="Status"
              onClick={() => onStatus(unit)}
            >
              <HugeiconsIcon icon={InformationCircleIcon} className="size-3.5" aria-hidden />
            </Button>
          </TooltipTrigger>
          <OpsActionsMenu
            name={unit.unit}
            disabled={disabled}
            onStart={() => onStart(unit)}
            onStop={() => onStop(unit)}
            onRestart={() => onRestart(unit)}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
