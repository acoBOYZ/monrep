import { useState, useTransition } from "react";
import { Button } from "@monrep/ui/base";
import { tryCatch } from "@monrep/utils";
import { eq, useLiveQuery } from "@tanstack/react-db";
import type { CollectorsMap } from "@/server/agent/schemas";
import { useStreamDb } from "@/db/useStreamDb";
import { parseCollectorsJson } from "@/server/agent/catalog";
import { updateRuntimeConfigFn } from "@/server/agent/functions";

type CollectorsSettingsProps = {
  serverId: string;
};

export function CollectorsSettings({ serverId }: CollectorsSettingsProps) {
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
  const remoteCollectors: CollectorsMap = (() => {
    if (!row) return {};
    try {
      return parseCollectorsJson(row.collectorsJson);
    } catch {
      return {};
    }
  })();
  const remoteBackground = row?.backgroundEnabled ?? true;

  const [draft, setDraft] = useState<{
    backgroundEnabled: boolean;
    collectors: CollectorsMap;
  } | null>(null);

  const backgroundEnabled = draft?.backgroundEnabled ?? remoteBackground;
  const collectors = draft?.collectors ?? remoteCollectors;

  const [savedHint, setSavedHint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const patchDraft = (next: { backgroundEnabled: boolean; collectors: CollectorsMap }) => {
    setDraft(next);
    setSavedHint(false);
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      const { error: err } = await tryCatch(
        updateRuntimeConfigFn({
          data: {
            serverId,
            backgroundEnabled,
            autoUpdate: row?.autoUpdate ?? true,
            collectors,
          },
        }),
      );
      if (err !== null) {
        setError(err instanceof Error ? err.message : "Save failed");
        return;
      }
      setDraft(null);
      setSavedHint(true);
    });
  };

  if (!isReady) {
    return <p className="mt-4 text-sm text-cool">Loading collectors…</p>;
  }

  const entries = Object.entries(collectors);

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold tracking-tight">Collectors</h2>
      <p className="mt-1 text-xs text-cool">
        Background jobs scheduled by the session alarm. Argv stays on the control plane.
      </p>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={backgroundEnabled}
          onChange={(e) => {
            patchDraft({
              backgroundEnabled: e.target.checked,
              collectors,
            });
          }}
        />
        Background enabled
      </label>
      <ul className="mt-4 space-y-3">
        {entries.map(([name, spec]) => (
          <li
            key={name}
            className="flex flex-wrap items-end gap-4 rounded-md border border-border/60 px-3 py-2"
          >
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={spec.enabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  patchDraft({
                    backgroundEnabled,
                    collectors: {
                      ...collectors,
                      [name]: { ...spec, enabled },
                    },
                  });
                }}
              />
              {name}
            </label>
            <label className="flex flex-col gap-1 text-xs text-cool">
              Interval (sec)
              <input
                type="number"
                min={5}
                className="w-24 rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
                value={spec.intervalSec}
                onChange={(e) => {
                  const intervalSec = Math.max(5, Number(e.target.value) || 5);
                  patchDraft({
                    backgroundEnabled,
                    collectors: {
                      ...collectors,
                      [name]: { ...spec, intervalSec },
                    },
                  });
                }}
              />
            </label>
            <p className="min-w-0 flex-1 truncate font-mono text-[11px] text-cool">
              {spec.argv.join(" ")}
            </p>
          </li>
        ))}
      </ul>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      {savedHint ? <p className="mt-2 text-xs text-cool">Saved</p> : null}
      <Button type="button" size="sm" className="mt-4" disabled={pending} onClick={save}>
        {pending ? "Saving…" : "Save collectors"}
      </Button>
    </section>
  );
}
