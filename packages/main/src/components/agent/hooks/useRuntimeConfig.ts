import { useState, useTransition } from "react";
import { tryCatch } from "@monrep/utils";
import { eq, useLiveQuery } from "@tanstack/react-db";
import type { CollectorsMap } from "@/server/agent/schemas";
import { useStreamDb } from "@/db/useStreamDb";
import { parseCollectorsJson } from "@/server/agent/catalog";
import { pushAgentConfigFn, sendAgentUpdateFn } from "@/server/agent/functions";

const parseRemoteCollectors = (raw: string | undefined): CollectorsMap => {
  if (!raw) return {};
  try {
    return parseCollectorsJson(raw);
  } catch {
    return {};
  }
};

type RuntimePatch = {
  backgroundEnabled?: boolean;
  autoUpdate?: boolean;
  collectors?: CollectorsMap;
};

export function useRuntimeConfig(serverId: string) {
  const { db, isReady } = useStreamDb("agent");
  const live = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q
        .from({ r: db.collections.runtime_config })
        .where(({ r }) => eq(r.serverId, serverId))
        .findOne();
    },
  });
  const row = live.data;
  const collectors = parseRemoteCollectors(row?.collectorsJson);
  const backgroundEnabled = row?.backgroundEnabled ?? true;
  const autoUpdate = row?.autoUpdate ?? true;

  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = (partial: RuntimePatch) => {
    if (!db) {
      setError("Stream not ready");
      return;
    }
    setError(null);
    const nextBackground = partial.backgroundEnabled ?? backgroundEnabled;
    const nextAutoUpdate = partial.autoUpdate ?? autoUpdate;
    const nextCollectors = partial.collectors ?? collectors;
    startTransition(async () => {
      const { error: err } = await tryCatch(
        db.actions.upsertRuntimeConfig({
          serverId,
          backgroundEnabled: nextBackground,
          autoUpdate: nextAutoUpdate,
          collectorsJson: JSON.stringify(nextCollectors),
        }).isPersisted.promise,
      );
      if (err) {
        setError(err instanceof Error ? err.message : "Save failed");
        return;
      }
      if (partial.autoUpdate !== undefined) {
        await pushAgentConfigFn({ data: { serverId, autoUpdate: nextAutoUpdate } });
      }
      setHint("Saved");
    });
  };

  const triggerUpdate = () => {
    setError(null);
    setHint(null);
    startTransition(async () => {
      const { data, error: err } = await tryCatch(sendAgentUpdateFn({ data: { serverId } }));
      if (err) {
        setError(err instanceof Error ? err.message : "Update request failed");
        return;
      }
      if (!data.ok) {
        setError("Agent session not connected");
        return;
      }
      setHint("Update requested — agent will restart if a newer binary is available");
    });
  };

  return {
    isReady,
    collectors,
    backgroundEnabled,
    autoUpdate,
    save,
    triggerUpdate,
    pending,
    error,
    hint,
    setError,
    setHint,
  };
}
