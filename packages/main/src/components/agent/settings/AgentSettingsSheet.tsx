import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  ScrollArea,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@monrep/ui/base";
import { AgentUpdateSection } from "./AgentUpdateSection";
import { CollectorsSection } from "./CollectorsSection";
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
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle>Agent settings</SheetTitle>
            {sheet.dirty ? <Badge variant="warning">unsaved</Badge> : null}
          </div>
          <SheetDescription>Runtime config is pushed to the agent when you save.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="px-4">
            <AgentUpdateSection
              autoUpdate={sheet.autoUpdate}
              online={online}
              pending={sheet.pending}
              onAutoUpdateChange={(enabled) => sheet.save({ autoUpdate: enabled })}
              onUpdateNow={sheet.triggerUpdate}
            />
            <CollectorsSection
              collectors={sheet.draft}
              backgroundEnabled={sheet.backgroundEnabled}
              pending={sheet.pending}
              onBackgroundEnabledChange={(enabled) => sheet.save({ backgroundEnabled: enabled })}
              onCollectorChange={sheet.update}
            />
          </div>
        </ScrollArea>
        {sheet.error ? (
          <Alert variant="destructive" className="mx-4">
            <AlertDescription>{sheet.error}</AlertDescription>
          </Alert>
        ) : null}
        {sheet.hint ? <p className="px-4 text-xs text-muted-foreground">{sheet.hint}</p> : null}
        <SheetFooter className="flex-row items-center justify-between border-t border-border/60">
          <Button type="button" variant="ghost" size="sm" onClick={sheet.resetToDefaults}>
            Reset to defaults
          </Button>
          <div className="flex gap-2">
            <SheetClose
              render={<Button nativeButton={false} variant="outline" size="sm" type="button" />}
            >
              Close
            </SheetClose>
            <Button
              type="button"
              size="sm"
              disabled={sheet.pending || !sheet.dirty}
              onClick={sheet.handleSaveCollectors}
            >
              Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
