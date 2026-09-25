import { useState } from "react";
import { Button } from "@monrep/ui/base";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { useSafeMutation } from "@/components/hooks/useSafeMutation";
import { useStreamDb } from "@/db/useStreamDb";

export const Route = createFileRoute("/_authenticated/playground/presence")({
  component: PresencePlayground,
});

function PresencePlayground() {
  const { db, isReady } = useStreamDb("demo");
  const safeMutation = useSafeMutation();
  const live = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q.from({ p: db.collections.presence }).orderBy(({ p }) => p.userId, "asc");
    },
  });
  const rows = live.data ?? [];

  const [name, setName] = useState("Demo");
  const [userId, setUserId] = useState("");

  const insertRow = () => {
    if (!db) return;
    safeMutation(() =>
      db.actions.upsertPresence(userId.length > 0 ? { userId, name } : { userId: "", name }),
    );
    setUserId("");
  };

  const renameFirst = () => {
    const first = rows[0];
    if (!db || !first) return;
    safeMutation(() => db.actions.upsertPresence({ userId: first.userId, name: `${name}-edited` }));
  };

  const deleteFirst = () => {
    const first = rows[0];
    if (!db || !first) return;
    void db.actions.deletePresence(first.userId);
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold tracking-tight">Presence playground</h1>
      <p className="text-xs text-muted-foreground">
        Live query on <code className="rounded bg-muted px-1">demo.presence</code> —{" "}
        {isReady ? "live" : "connecting"} · {rows.length} rows
      </p>

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-xs">
          userId
          <input
            className="rounded border border-border bg-card px-2 py-1.5 font-mono text-sm"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          name
          <input
            className="rounded border border-border bg-card px-2 py-1.5 text-sm"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={insertRow}>
            Upsert
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={renameFirst}>
            Rename first
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={deleteFirst}>
            Delete first
          </Button>
        </div>
      </div>

      <ul className="divide-y divide-border/60 rounded-md border border-border/60 text-sm">
        {rows.map((row) => (
          <li key={row.userId} className="flex justify-between gap-2 px-3 py-2 font-mono text-xs">
            <span>{row.userId}</span>
            <span>{row.name ?? "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
