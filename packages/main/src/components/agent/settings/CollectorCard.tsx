import { useId } from "react";
import { CopyableButton, Label, NumberInput, Switch, TooltipTrigger } from "@monrep/ui/base";
import { cn } from "@monrep/utils";
import type { CollectorsMap } from "@/server/agent/schemas";

export type CollectorSpec = CollectorsMap[string];

type CollectorCardProps = {
  name: string;
  spec: CollectorSpec;
  disabled: boolean;
  onChange: (next: CollectorSpec) => void;
};

export function CollectorCard({ name, spec, disabled, onChange }: CollectorCardProps) {
  const intervalId = useId();
  const argvText = spec.argv.join(" ");
  const dimmed = !spec.enabled || disabled;

  const handleCheckedChange = (checked: boolean) => {
    onChange({ ...spec, enabled: checked });
  };

  const handleIntervalChange = (value?: number) => {
    onChange({ ...spec, intervalSec: Math.max(5, value ?? 5) });
  };

  return (
    <div
      data-disabled={dimmed ? "" : undefined}
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border/60 bg-card/40 p-3",
        dimmed && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-medium">{name}</span>
        <Switch checked={spec.enabled} disabled={disabled} onCheckedChange={handleCheckedChange} />
      </div>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
        <Label htmlFor={intervalId}>Interval</Label>
        <div className="flex items-center gap-2">
          <NumberInput
            id={intervalId}
            className="max-w-24"
            min={5}
            stepper={5}
            disabled={disabled || !spec.enabled}
            value={spec.intervalSec}
            onValueChange={handleIntervalChange}
          />
          <span className="text-xs text-muted-foreground">s</span>
        </div>
        <Label>Command</Label>
        <div className="min-w-0 overflow-hidden">
          <TooltipTrigger content={argvText}>
            <CopyableButton
              variant="inline"
              text={argvText}
              className="block max-w-full truncate font-mono text-[11px]"
            />
          </TooltipTrigger>
        </div>
      </div>
    </div>
  );
}
