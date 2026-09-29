import { useRuntimeConfig } from "@/components/agent/hooks/useRuntimeConfig";

export function useAgentSettingsSheet(serverId: string, onOpenChange: (open: boolean) => void) {
  const runtime = useRuntimeConfig(serverId);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
  };

  const handleSaveMetrics = () => {
    runtime.save({
      backgroundEnabled: runtime.metricsEnabled,
      metricsIntervalSec: runtime.metricsIntervalSec,
    });
  };

  const resetToDefaults = () => {
    runtime.save({ backgroundEnabled: true, metricsIntervalSec: 30, autoUpdate: true });
  };

  return { ...runtime, handleOpenChange, handleSaveMetrics, resetToDefaults, dirty: false };
}
