import { useCallback, useMemo, useState } from "react";
import { useOpsList } from "@/components/agent/hooks/useOpsList";
import { useOpsServer } from "@/components/agent/hooks/useOpsServer";
import { DOCKER_LIST_ARGV, countBadDocker } from "@/components/agent/utils/opsListArgv";
import { parseDockerPsNdjson } from "@/components/agent/utils/opsParse";

export function useDockerOpsPage(serverId: string) {
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
    listArgv: DOCKER_LIST_ARGV,
    parse: (lines) => {
      const { containers, parseError } = parseDockerPsNdjson(lines);
      return { items: containers, parseError };
    },
  });

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.image.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q),
    );
  }, [items, filter]);

  const refresh = useCallback(() => {
    refreshList();
  }, [refreshList]);

  const runVerb = useCallback(
    (argv: Array<string>, _containerId: string, onDone?: () => void) => {
      if (!online || busy) return;
      void runAsync(argv)
        .then(() => onDone?.())
        .catch(() => {
          /* error in hook state */
        });
    },
    [online, busy, runAsync],
  );

  return {
    server,
    isReady,
    online: Boolean(online),
    filter,
    setFilter,
    filtered,
    disabled: !online || busy,
    items,
    listError,
    loading,
    busy,
    error,
    cancel,
    counts: {
      total: items.length,
      totalLabel: "containers",
      bad: countBadDocker(items),
      badLabel: "not running",
    },
    refresh,
    runVerb,
  };
}
