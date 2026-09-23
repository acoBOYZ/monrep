import { useState } from "react";
import { sessionPresenceCollection } from "@monrep/db/collections";
import { useStreamDb } from "@monrep/db/stream";
import { Button } from "@monrep/ui/base";
import { useLiveQuery } from "@tanstack/react-db";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/playground/presence")({
  component: PresencePlayground,
});

function PresencePlayground() {
  const { db, isReady } = useStreamDb("session");
  const live = useLiveQuery({
    query: (q) => q.from({ p: sessionPresenceCollection }).orderBy(({ p }) => p.userId, "asc"),
  });
  const rows = live.data;

  const [name, setName] = useState("Ada");
  const [userId, setUserId] = useState("ada");

  const insertRow = () => {
    if (!db || userId.length === 0) return;
    void db.actions.upsertPresence({ userId, name });
    setUserId(`user-${crypto.randomUUID().slice(0, 8)}`);
  };

  const renameFirst = () => {
    const first = rows[0];
    if (!db || !first) return;
    void db.actions.upsertPresence({ ...first, name: `${name}-edited` });
  };

  const deleteFirst = () => {
    const first = rows[0];
    if (!db || !first) return;
    void db.actions.deletePresence(first.userId);
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-4 bg-background p-6 text-foreground">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">Presence playground</h1>
        <Link to="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Home
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        <code className="rounded bg-muted px-1">sessionPresenceCollection</code> SSR + live handoff.
        Mutations via <code className="rounded bg-muted px-1">useStreamDb</code>. Open two tabs to
        verify realtime.
      </p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md border border-border/60 p-3 text-xs">
        <dt className="text-muted-foreground">Stream</dt>
        <dd>{isReady ? "live" : "connecting"}</dd>
        <dt className="text-muted-foreground">Rows</dt>
        <dd>{rows.length}</dd>
      </dl>

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
          <Button type="button" size="sm" onClick={insertRow} disabled={!isReady}>
            Insert
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={renameFirst}
            disabled={!isReady}
          >
            Update first
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={deleteFirst}
            disabled={!isReady}
          >
            Delete first
          </Button>
        </div>
      </div>

      <ul className="divide-y divide-border/60 overflow-hidden rounded-md border border-border/60">
        {rows.length === 0 ? (
          <li className="px-3 py-4 text-sm text-muted-foreground">No presence rows yet.</li>
        ) : (
          rows.map((row) => (
            <li
              key={row.userId}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <span className="font-medium">{row.name ?? "(unnamed)"}</span>
              <span className="truncate font-mono text-xs text-muted-foreground">{row.userId}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
