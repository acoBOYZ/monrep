import { useCallback, useState } from "react";
import { deepEquals } from "@tanstack/react-db";
import type { CollectorsMap } from "@/server/agent/schemas";
import { DEFAULT_COLLECTORS } from "@/server/agent/catalog";

type CollectorSpec = CollectorsMap[string];

export function useCollectorsDraft(remote: CollectorsMap) {
  const [local, setLocal] = useState<CollectorsMap | null>(null);
  const pendingLocal = local !== null && !deepEquals(local, remote);
  if (local !== null && !pendingLocal) {
    setLocal(null);
  }
  const draft = pendingLocal ? local : remote;
  const dirty = pendingLocal;

  const update = useCallback(
    (name: string, spec: CollectorSpec) => {
      setLocal((prev) => {
        const base = prev ?? remote;
        return { ...base, [name]: spec };
      });
    },
    [remote],
  );

  const reset = useCallback(() => {
    setLocal(null);
  }, []);

  const resetToDefaults = useCallback(() => {
    setLocal({ ...DEFAULT_COLLECTORS });
  }, []);

  const commit = useCallback((): CollectorsMap => local ?? remote, [local, remote]);

  return { commit, dirty, draft, reset, resetToDefaults, update };
}
