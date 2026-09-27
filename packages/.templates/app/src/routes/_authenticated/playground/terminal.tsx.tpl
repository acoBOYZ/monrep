import { useMemo, useState } from "react";
import { moduleEpochLabel } from "@monrep/db/stream";
import { Terminal, TerminalInput, TerminalOutput } from "@monrep/ui/terminal";
import { nextUlid } from "@monrep/utils/ulid";
import { eq, queryOnce, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import type { TerminalTabSpec } from "@monrep/ui/terminal";
import { useSafeMutation } from "@/components/hooks/useSafeMutation";
import { PlaygroundLiveStatus } from "@/components/playground/PlaygroundLiveStatus";
import { useStreamDb } from "@/db/useStreamDb";

export const Route = createFileRoute("/_authenticated/playground/terminal")({
  component: TerminalPlayground,
});

const USER_ID_KEY = "demo-term-userId";
const USER_NAME_KEY = "demo-term-name";
const MAX_LINES = 1000;

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

type LineRow = {
  id?: string;
  tabId: string;
  userId: string;
  name: string;
  kind: "in" | "out" | "meta";
  text: string;
  createdAt?: string;
};

function TerminalPlayground() {
  const { db, isReady } = useStreamDb("demo");
  const safeMutation = useSafeMutation();
  const [userId] = useState(readOrCreateUserId);
  const [name, setName] = useState(readStoredName);
  const [seedTabId] = useState(() => nextUlid(null));
  const [localTabIds, setLocalTabIds] = useState<Array<string>>(() => []);
  const [activeTabId, setActiveTabId] = useState(seedTabId);
  const [hourBucket] = useState(() => moduleEpochLabel("demo") ?? "—");

  const { data: lineRows = [] } = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q
        .from({ l: db.collections.line })
        .select(({ l }) => ({
          id: l.id,
          tabId: l.tabId,
          userId: l.userId,
          name: l.name,
          kind: l.kind,
          text: l.text,
          createdAt: l.createdAt,
        }))
        .orderBy(({ l }) => l.createdAt, "asc")
        .orderBy(({ l }) => l.id, "asc");
    },
  });

  const remoteTabIds = useMemo(() => {
    const seen = new Set<string>();
    const ordered: Array<string> = [];
    for (const row of lineRows) {
      if (!row.tabId || seen.has(row.tabId)) continue;
      seen.add(row.tabId);
      ordered.push(row.tabId);
    }
    return ordered;
  }, [lineRows]);

  const tabIds = useMemo(() => {
    const seen = new Set<string>();
    const ordered: Array<string> = [];
    for (const id of [...remoteTabIds, ...localTabIds]) {
      if (seen.has(id)) continue;
      seen.add(id);
      ordered.push(id);
    }
    return ordered.length > 0 ? ordered : [seedTabId];
  }, [remoteTabIds, localTabIds, seedTabId]);

  const linesByTab = useMemo(() => {
    const map = new Map<string, Array<LineRow>>();
    for (const id of tabIds) map.set(id, []);
    for (const row of lineRows) {
      const list = map.get(row.tabId);
      if (list) list.push(row);
      else map.set(row.tabId, [row]);
    }
    for (const [id, list] of map) {
      if (list.length > MAX_LINES) map.set(id, list.slice(list.length - MAX_LINES));
    }
    return map;
  }, [lineRows, tabIds]);

  // UI + mutations must share this — `activeTabId` can still be a fresh seed after remotes load.
  const resolvedActiveId = tabIds.includes(activeTabId) ? activeTabId : (tabIds[0] ?? seedTabId);

  const onNameChange = (value: string) => {
    setName(value);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(USER_NAME_KEY, value);
    }
  };

  const publishMeta = (tabId: string, text: string) => {
    if (!db) return;
    safeMutation(() =>
      db.actions.upsertLine({
        tabId,
        userId,
        name: name.trim() || "Demo",
        kind: "meta",
        text,
      }),
    );
  };

  const deleteTab = (tabId: string) => {
    if (!db) return;
    const keys = lineRows.flatMap((row) =>
      row.tabId === tabId && typeof row.id === "string" ? [row.id] : [],
    );
    if (keys.length === 0) return;
    safeMutation(() => {
      db.actions.deleteLine(keys);
    });
  };

  const onClear = () => {
    if (!db) return;
    const keys = lineRows.flatMap((row) =>
      row.tabId === resolvedActiveId && typeof row.id === "string" ? [row.id] : [],
    );
    if (keys.length === 0) return;
    safeMutation(() => {
      db.actions.deleteLine(keys);
    });
  };

  const handleAddTab = () => {
    const tabId = nextUlid(null);
    setLocalTabIds((prev) => [...prev, tabId]);
    setActiveTabId(tabId);
    publishMeta(tabId, "tab opened");
  };

  const handleCloseTab = (id: string) => {
    if (tabIds.length <= 1) return;
    setLocalTabIds((prev) => prev.filter((t) => t !== id));
    if (id === activeTabId || id === resolvedActiveId) {
      const remaining = tabIds.filter((t) => t !== id);
      setActiveTabId(remaining[0] ?? seedTabId);
    }
    deleteTab(id);
  };

  const handleInput = (text: string) => {
    if (!db) return;
    if (text.trim() === "clear") {
      onClear();
      return;
    }

    safeMutation(() =>
      db.actions.upsertLine({
        tabId: resolvedActiveId,
        userId,
        name: name.trim() || "Demo",
        kind: "in",
        text,
      }),
    );
  };

  const renderLines = (tabId: string) => {
    const lines = linesByTab.get(tabId) ?? [];
    return lines.map((row) => {
      const key = row.id ?? `${row.createdAt}-${row.text}`;
      const label = `${row.name}: ${row.text}`;
      if (row.kind === "in") {
        return <TerminalInput key={key}>{label}</TerminalInput>;
      }
      if (row.kind === "out") {
        return <TerminalOutput key={key}>{label}</TerminalOutput>;
      }
      return (
        <TerminalOutput key={key} className="text-cool">
          {label}
        </TerminalOutput>
      );
    });
  };

  const terminalTabs: Array<TerminalTabSpec> = tabIds.map((tabId) => ({
    id: tabId,
    title: "~",
    content: <div key={tabId}>{renderLines(tabId)}</div>,
  }));

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Terminal</h1>
          <p className="mt-1 text-sm text-cool">
            Shared typed lines on <code className="rounded bg-muted px-1">demo.line</code> with{" "}
            <code className="rounded bg-muted px-1">tabId</code>. Tabs sync live across auth users.
          </p>
        </div>
        <PlaygroundLiveStatus isReady={isReady} hourBucket={hourBucket} />
      </header>

      <label className="flex flex-col gap-1 text-xs" htmlFor="term-display-name">
        Display name
        <input
          id="term-display-name"
          className="rounded border border-border bg-card px-2 py-1.5 text-sm"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </label>

      <Terminal
        name="playground-term"
        height="420px"
        tabs={terminalTabs}
        activeTabId={resolvedActiveId}
        onActiveTabChange={setActiveTabId}
        onTabAdd={handleAddTab}
        onTabClose={handleCloseTab}
        onInput={isReady ? handleInput : null}
        onClear={isReady ? onClear : undefined}
      />
    </main>
  );
}
