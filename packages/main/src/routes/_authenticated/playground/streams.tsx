import { useRef, useState } from "react";
import { moduleEpochLabel, useStreamDb } from "@monrep/db/stream";
import { Button } from "@monrep/ui/base";
import { cn, formatTime, toDateTimeAttr } from "@monrep/utils";
import { nextUlid } from "@monrep/utils/ulid";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { useSafeMutation } from "@/components/hooks/useSafeMutation";

export const Route = createFileRoute("/_authenticated/playground/streams")({
  component: StreamsPlayground,
});

const USER_ID_KEY = "testm-chat-userId";
const USER_NAME_KEY = "testm-chat-name";
const TYPING_DEBOUNCE_MS = 50;

function readOrCreateUserId(): string {
  if (typeof sessionStorage === "undefined") return nextUlid(null);
  const existing = sessionStorage.getItem(USER_ID_KEY);
  if (existing) return existing;
  const id = nextUlid(null);
  sessionStorage.setItem(USER_ID_KEY, id);
  return id;
}

function readStoredName(): string {
  if (typeof sessionStorage === "undefined") return "Aco";
  return sessionStorage.getItem(USER_NAME_KEY) ?? "Aco";
}

function StreamsPlayground() {
  const { db, isReady } = useStreamDb("testm");
  const safeMutation = useSafeMutation();
  const [userId] = useState(readOrCreateUserId);
  const [name, setName] = useState(readStoredName);
  const [draft, setDraft] = useState("");
  const [hourBucket] = useState(() => moduleEpochLabel("testm") ?? "—");
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const typingLive = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q.from({ t: db.collections.typing });
    },
  });
  const othersTyping = (typingLive.data ?? []).filter(
    (row) => row.userId !== userId && row.draft.trim().length > 0,
  );

  const publishTyping = (nextDraft: string, nextName: string) => {
    if (!db) return;
    if (nextDraft.trim().length === 0) {
      safeMutation(() => db.actions.deleteTyping(userId));
      return;
    }
    safeMutation(() => db.actions.upsertTyping({ userId, name: nextName, draft: nextDraft }));
  };

  const onNameChange = (value: string) => {
    setName(value);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(USER_NAME_KEY, value);
    }
    if (draft.trim().length > 0) publishTyping(draft, value);
  };

  const onDraftChange = (value: string) => {
    setDraft(value);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      publishTyping(value, name);
    }, TYPING_DEBOUNCE_MS);
  };

  const sendMessage = () => {
    const body = draft.trim();
    if (!db || !body) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    safeMutation(() => db.actions.upsertMessage({ userId, name: name.trim() || "Anon", body }));
    safeMutation(() => db.actions.deleteTyping(userId));
    setDraft("");
  };

  return (
    <main className="mx-auto flex h-full max-h-[calc(100svh-12rem)] max-w-xl flex-col gap-4 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Streams</h1>
          <p className="mt-1 text-sm text-cool">
            Live chat on <code className="rounded bg-muted px-1">testm</code> — same session as
            presence. Hour bucket rolls via <code className="rounded bg-muted px-1">utc-hour</code>.
          </p>
        </div>
        <dl className="flex gap-3 text-xs text-muted-foreground">
          <div>
            <dt className="sr-only">Stream</dt>
            <dd>{isReady ? "live" : "connecting"}</dd>
          </div>
          <div>
            <dt className="sr-only">UTC hour</dt>
            <dd className="font-mono text-cool">{hourBucket}</dd>
          </div>
        </dl>
      </header>

      <label className="flex flex-col gap-1 text-xs">
        Display name
        <input
          className="rounded border border-border bg-card px-2 py-1.5 text-sm"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </label>

      <section
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border/60"
        aria-label="Messages"
      >
        <ul className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted-foreground">
              No messages this hour yet. Open another tab and type.
            </li>
          ) : (
            messages.map((row) => {
              const dateTime = toDateTimeAttr(row.createdAt);
              const timeLabel = formatTime(row.createdAt);
              return (
                <li
                  key={row.id}
                  className={cn(
                    "relative min-w-24",
                    "max-w-[85%] rounded-md bg-muted px-2.5 pt-1.5 pb-4",
                    row.userId === userId
                      ? "self-end rounded-tr-none text-right"
                      : "self-start rounded-tl-none text-left",
                  )}
                >
                  <span className="block text-left text-xs text-cool">{row.name}</span>
                  <span className="block text-left text-sm text-foreground">{row.body}</span>
                  {dateTime && timeLabel ? (
                    <time
                      className="absolute right-1 bottom-px text-[10px] text-muted-foreground"
                      dateTime={dateTime}
                    >
                      {timeLabel}
                    </time>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>

        {othersTyping.length > 0 ? (
          <div className="border-t border-border/40 px-3 py-2 text-xs text-cool">
            {othersTyping.map((row) => (
              <p key={row.userId} className="truncate">
                <span className="font-medium text-foreground">{row.name}</span>
                {": "}
                {row.draft}
              </p>
            ))}
          </div>
        ) : null}

        <form
          className="flex gap-2 border-t border-border/60 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <input
            className="min-w-0 flex-1 rounded border border-border bg-card px-2 py-1.5 text-sm"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Message…"
            disabled={!isReady}
            aria-label="Message"
          />
          <Button type="submit" size="sm" disabled={!isReady || draft.trim().length === 0}>
            Send
          </Button>
        </form>
      </section>
    </main>
  );
}
