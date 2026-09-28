import { useCallback, useMemo, useState } from "react";
import type { SystemdUnit } from "@/components/agent/utils/opsParse";
import { useOpsList } from "@/components/agent/hooks/useOpsList";
import { useOpsSelection } from "@/components/agent/hooks/useOpsSelection";
import { useOpsServer } from "@/components/agent/hooks/useOpsServer";
import { SYSTEMD_LIST_ARGV, countFailedUnits } from "@/components/agent/utils/opsListArgv";
import { parseSystemctlUnitsJson } from "@/components/agent/utils/opsParse";

export function useServicesOpsPage(serverId: string) {
  const { server, isReady, online } = useOpsServer(serverId);
  const [filter, setFilter] = useState("");
  const {
    items,
    listError,
    loading,
    busy,
    error,
    refresh: refreshList,
    runAsync,
    cancel,
  } = useOpsList({
    serverId,
    online: Boolean(online),
    listArgv: SYSTEMD_LIST_ARGV,
    parse: (lines) => {
      const { units, parseError } = parseSystemctlUnitsJson(lines);
      return { items: units, parseError };
    },
  });
  const selection = useOpsSelection(Boolean(online), busy, runAsync);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (u) => u.unit.toLowerCase().includes(q) || u.description.toLowerCase().includes(q),
    );
  }, [items, filter]);

  const selected = items.find((u) => u.unit === selection.selectedKey) ?? null;

  const refresh = useCallback(() => {
    refreshList({
      selectedKey: selection.selectedKey,
      onSelectedGone: selection.clearSelection,
      isSelected: (item, key) => (item as SystemdUnit).unit === key,
    });
  }, [refreshList, selection.selectedKey, selection.clearSelection]);

  const systemdUnavailable = Boolean(
    listError?.includes("systemctl") || listError?.includes("Could not parse systemctl"),
  );
  const listErrorVariant = systemdUnavailable ? ("default" as const) : ("destructive" as const);
  const listErrorMessage = systemdUnavailable
    ? "systemd not available on this host — use Shell for interactive control"
    : listError;

  return {
    server,
    isReady,
    online,
    filter,
    setFilter,
    filtered,
    selected,
    disabled: !online || busy,
    items,
    listError: listErrorMessage,
    listErrorVariant,
    loading,
    busy,
    error,
    cancel,
    counts: {
      total: items.length,
      totalLabel: "units",
      bad: countFailedUnits(items),
      badLabel: "failed",
    },
    refresh,
    ...selection,
  };
}
