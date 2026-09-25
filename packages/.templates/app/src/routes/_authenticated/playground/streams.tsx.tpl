import { useState } from "react";
import { moduleEpochLabel } from "@monrep/db/stream";
import { Button } from "@monrep/ui/base";
import { nextUlid } from "@monrep/utils/ulid";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { useSafeMutation } from "@/components/hooks/useSafeMutation";
import { useStreamDb } from "@/db/useStreamDb";

export const Route = createFileRoute("/_authenticated/playground/streams")({
  component: StreamsPlayground,
});

const USER_ID_KEY = "demo-chat-userId";
const USER_NAME_KEY = "demo-chat-name";

function readOrCreateUserId(): string {
  if (typeof sessionStorage === "undefined") return nextUlid(null);
  const existing = sessionStorage.getItem(USER_ID_KEY);
  if (existing) return existing;
  const id = nextUlid(null);
  sessionStorage.setItem(USER_ID_KEY, id);
  return id;
}

function readStoredName(): string {
  if (typeof sessionStorage === "undefined") return "Demo";
  return sessionStorage.getItem(USER_NAME_KEY) ?? "Demo";
}

function StreamsPlayground() {
  const { db, isReady } = useStreamDb("demo");
  const safeMutation = useSafeMutation();
  const [userId] = useState(readOrCreateUserId);
  const [name, setName] = useState(readStoredName);
  const [draft, setDraft] = useState("");
  const [hourBucket] = useState(() => moduleEpochLabel("demo") ?? "—");

  const { data: messages = [] } = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q
        .from({ m: db.collections.message })
        .select(({ m }) => ({
          id: m.id,
          userId: m.userId,
          name: m.name,
          body: m.body,
          createdAt: m.createdAt,
        }))
        .orderBy(({ m }) => m.createdAt, "asc")
        .orderBy(({ m }) => m.id, "asc");
    },
  });

  const onNameChange = (value: string) => {
    setName(value);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(USER_NAME_KEY, value);
    }
  };

  const send = () => {
    const body = draft.trim();
    if (!db || body.length === 0) return;
    safeMutation(() => db.actions.upsertMessage({ userId, name, body }));
    setDraft("");
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold tracking-tight">Streams playground</h1>
      <p className="text-xs text-muted-foreground">
        Module <code className="rounded bg-muted px-1">demo</code> · epoch {hourBucket} ·{" "}
        {isReady ? "live" : "connecting"}
      </p>

      <label className="flex flex-col gap-1 text-xs">
        Display name
        <input
          className="rounded border border-border bg-card px-2 py-1.5 text-sm"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </label>

      <ul className="max-h-72 space-y-2 overflow-y-auto rounded-md border border-border/60 p-3 text-sm">
        {messages.map((m) => (
          <li key={m.id}>
            <span className="font-medium">{m.name}</span>
            <span className="text-muted-foreground"> · </span>
            {m.body}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1 text-xs">
          Message
          <input
            className="rounded border border-border bg-card px-2 py-1.5 text-sm"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") send();
            }}
          />
        </label>
        <Button type="button" className="self-end" onClick={send}>
          Send
        </Button>
      </div>
    </div>
  );
}
