import {
  Button,
  ScrollArea,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@monrep/ui/base";
import { AgentPreferenceSection } from "./AgentPreferenceSection";
import { AgentUpdateSection } from "./AgentUpdateSection";
import { MetricsSection } from "./MetricsSection";
import { useAgentSettingsSheet } from "./useAgentSettingsSheet";

type AgentSettingsSheetProps = {
  serverId: string;
  online: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AgentSettingsSheet({
  serverId,
  online,
  open,
  onOpenChange,
}: AgentSettingsSheetProps) {
  const sheet = useAgentSettingsSheet(serverId, onOpenChange);

  return (
    <Sheet open={open} onOpenChange={sheet.handleOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border/60">
          <SheetTitle>Agent settings</SheetTitle>
          <SheetDescription>Runtime config is pushed to the agent when you save.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-4">
            <AgentPreferenceSection
              serverName={sheet.serverName}
              pending={sheet.pending}
              onServerNameChange={sheet.saveServerName}
            />
            <Separator />
            <AgentUpdateSection
              autoUpdate={sheet.autoUpdate}
              online={online}
              pending={sheet.pending}
              onAutoUpdateChange={(enabled) => sheet.save({ autoUpdate: enabled })}
              onUpdateNow={sheet.triggerUpdate}
            />
            <MetricsSection
              metricsEnabled={sheet.metricsEnabled}
              metricsIntervalSec={sheet.metricsIntervalSec}
              pending={sheet.pending}
              onMetricsEnabledChange={(enabled) => sheet.save({ backgroundEnabled: enabled })}
              onIntervalChange={(sec) => sheet.save({ metricsIntervalSec: sec })}
            />
          </div>
        </ScrollArea>
        <SheetFooter className="flex-row items-center justify-between border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            className="border border-dashed"
            size="sm"
            onClick={sheet.resetToDefaults}
          >
            Reset to defaults
          </Button>
          <SheetClose
            render={<Button nativeButton={false} variant="outline" size="sm" type="button" />}
          >
            Close
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
