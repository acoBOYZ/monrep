import { useCollectorsDraft } from "./useCollectorsDraft";
import { useRuntimeConfig } from "@/components/agent/hooks/useRuntimeConfig";

export function useAgentSettingsSheet(serverId: string, onOpenChange: (open: boolean) => void) {
  const runtime = useRuntimeConfig(serverId);
  const draftState = useCollectorsDraft(runtime.collectors);

  const handleOpenChange = (next: boolean) => {
    if (next) draftState.reset();
    onOpenChange(next);
  };

  const handleSaveCollectors = () => {
    runtime.save({ collectors: draftState.commit() });
  };

  return { ...runtime, ...draftState, handleOpenChange, handleSaveCollectors };
}
