import { MoreVertical } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, SmartPopoverTrigger } from "@monrep/ui/base";
import { createOpsActionsMenuRenderer } from "./opsActionsMenuRenderer";

type OpsActionsMenuProps = {
  name: string;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
};

export function OpsActionsMenu({
  name,
  disabled,
  onStart,
  onStop,
  onRestart,
}: OpsActionsMenuProps) {
  return (
    <SmartPopoverTrigger
      disabled={disabled}
      className="w-44 p-1"
      content={createOpsActionsMenuRenderer({ name, onStart, onStop, onRestart })}
    >
      <Button type="button" size="iconxs" variant="ghost" disabled={disabled} aria-label="Actions">
        <HugeiconsIcon icon={MoreVertical} className="size-3.5" aria-hidden />
      </Button>
    </SmartPopoverTrigger>
  );
}
