import { RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, Switch, TooltipTrigger } from "@monrep/ui/base";
import { SettingRow } from "./SettingRow";

type AgentUpdateSectionProps = {
  autoUpdate: boolean;
  online: boolean;
  pending: boolean;
  onAutoUpdateChange: (enabled: boolean) => void;
  onUpdateNow: () => void;
};

export function AgentUpdateSection({
  autoUpdate,
  online,
  pending,
  onAutoUpdateChange,
  onUpdateNow,
}: AgentUpdateSectionProps) {
  const updateButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending || !online}
      onClick={onUpdateNow}
    >
      <HugeiconsIcon icon={RefreshIcon} className="size-4" aria-hidden />
      Update
    </Button>
  );

  return (
    <section>
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground">Updates</h3>
      <SettingRow
        label="Auto-update"
        description="Checks GitHub Releases periodically and restarts on a newer binary"
      >
        <Switch checked={autoUpdate} disabled={pending} onCheckedChange={onAutoUpdateChange} />
      </SettingRow>
      <SettingRow
        label="Update now"
        description="Pull the latest release onto this host immediately"
      >
        {!online ? (
          <TooltipTrigger content="Agent offline">{updateButton}</TooltipTrigger>
        ) : (
          updateButton
        )}
      </SettingRow>
    </section>
  );
}
