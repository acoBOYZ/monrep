import { useState, useTransition } from "react";
import { Button } from "@monrep/ui/base";
import { tryCatch } from "@monrep/utils";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { useStreamDb } from "@/db/useStreamDb";
import { parseCollectorsJson } from "@/server/agent/catalog";
import { sendAgentUpdateFn, updateRuntimeConfigFn } from "@/server/agent/functions";

type AgentUpdateSettingsProps = {
  serverId: string;
  online: boolean;
};

export function AgentUpdateSettings({ serverId, online }: AgentUpdateSettingsProps) {
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
  const remoteAuto = row?.autoUpdate ?? true;
  const [draftAuto, setDraftAuto] = useState<boolean | null>(null);
  const autoUpdate = draftAuto ?? remoteAuto;

  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const saveAuto = (next: boolean) => {
    setDraftAuto(next);
    setError(null);
    setHint(null);
    startTransition(async () => {
      const collectors = (() => {
        if (!row) return {};
        try {
          return parseCollectorsJson(row.collectorsJson);
        } catch {
          return {};
        }
      })();
      const { error: err } = await tryCatch(
        updateRuntimeConfigFn({
          data: {
            serverId,
            backgroundEnabled: row?.backgroundEnabled ?? true,
            autoUpdate: next,
            collectors,
          },
        }),
      );
      if (err !== null) {
        setError(err instanceof Error ? err.message : "Save failed");
        setDraftAuto(null);
        return;
      }
      setDraftAuto(null);
      setHint(next ? "Auto-update enabled" : "Auto-update disabled");
    });
  };

  const triggerUpdate = () => {
    setError(null);
    setHint(null);
    startTransition(async () => {
      const { data, error: err } = await tryCatch(sendAgentUpdateFn({ data: { serverId } }));
      if (err !== null) {
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

  if (!isReady) {
    return <p className="mt-4 text-sm text-cool">Loading update settings…</p>;
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold tracking-tight">Agent updates</h2>
      <p className="mt-1 text-xs text-cool">
        Auto-update is on by default. The daemon checks GitHub Releases periodically and can be
        triggered from here.
      </p>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={autoUpdate}
          disabled={pending}
          onChange={(e) => {
            saveAuto(e.target.checked);
          }}
        />
        Auto-update agent
      </label>
      <div className="mt-4">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending || !online}
          onClick={triggerUpdate}
        >
          {pending ? "Working…" : "Update now"}
        </Button>
        {!online ? (
          <p className="mt-2 text-xs text-cool">Connect the agent to trigger an update.</p>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      {hint ? <p className="mt-2 text-xs text-cool">{hint}</p> : null}
    </section>
  );
}
