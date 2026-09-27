import { useEffect, useRef, useState } from "react";
import { Button } from "@monrep/ui/base";
import { Terminal, TerminalInput, TerminalOutput } from "@monrep/ui/terminal";
import { tryCatch } from "@monrep/utils";
import { eq, useLiveQuery } from "@tanstack/react-db";
import type { TerminalTabSpec } from "@monrep/ui/terminal";
import { useStreamDb } from "@/db/useStreamDb";
import { sendAgentCancelFn, sendAgentRunFn } from "@/server/agent/functions";

const MAX_TAB_LINES = 2_000;

type TabLine =
  | { id: string; kind: "in"; text: string }
  | { id: string; kind: "out"; text: string; stream?: string }
  | { id: string; kind: "meta"; text: string };

type AgentTab = {
  id: string;
  title: string;
  runId: string | null;
  localLines: Array<TabLine>;
};

type AgentTerminalProps = {
  serverId: string;
  online: boolean;
};

type AgentDbHandle = ReturnType<typeof useStreamDb<"agent">>["db"];

type RunPayloadBody = {
  stream?: string;
  line?: string;
  busy?: boolean;
  exit_code?: number;
  cancelled?: boolean;
  message?: string;
};

type RunPayload = {
  op?: string;
  body?: RunPayloadBody;
};

const newTab = (): AgentTab => ({
  id: crypto.randomUUID(),
  title: "~",
  runId: null,
  localLines: [],
});

const lineToArgv = (line: string): Array<string> => {
  const trimmed = line.trim();
  if (!trimmed) return [];
  return ["/bin/sh", "-c", trimmed];
};

const trimLines = (lines: Array<TabLine>): Array<TabLine> => {
  if (lines.length <= MAX_TAB_LINES) return lines;
  return lines.slice(lines.length - MAX_TAB_LINES);
};

const metaLine = (text: string): TabLine => ({
  id: crypto.randomUUID(),
  kind: "meta",
  text,
});

const parseRunPayload = (raw: string): RunPayload | null => {
  try {
    return JSON.parse(raw) as RunPayload;
  } catch {
    return null;
  }
};

const payloadToLines = (payload: RunPayload, idPrefix: string): Array<TabLine> => {
  const body = payload.body;
  if (payload.op === "event" && typeof body?.line === "string") {
    return [{ id: `${idPrefix}-out`, kind: "out", text: body.line, stream: body.stream }];
  }
  if (payload.op !== "result" && payload.op !== "error") return [];
  if (body?.busy) return [{ id: `${idPrefix}-busy`, kind: "meta", text: "busy" }];
  if (body?.cancelled) return [{ id: `${idPrefix}-cancel`, kind: "meta", text: "cancelled" }];
  if (typeof body?.exit_code === "number") {
    return [{ id: `${idPrefix}-exit`, kind: "meta", text: `exit ${body.exit_code}` }];
  }
  if (body?.message) return [{ id: `${idPrefix}-msg`, kind: "meta", text: body.message }];
  return [];
};

const appendLocal = (tabs: Array<AgentTab>, tabId: string, line: TabLine): Array<AgentTab> =>
  tabs.map((t) => (t.id === tabId ? { ...t, localLines: trimLines([...t.localLines, line]) } : t));

export function AgentTerminal({ serverId, online }: AgentTerminalProps) {
  const [seed] = useState(() => newTab());
  const [tabs, setTabs] = useState<Array<AgentTab>>(() => [seed]);
  const [activeId, setActiveId] = useState(seed.id);
  const { db } = useStreamDb("agent");

  const openTab = () => {
    const tab = newTab();
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
  };

  const closeTab = (id: string) => {
    const tab = tabs.find((t) => t.id === id);
    if (tab?.runId) {
      void tryCatch(sendAgentCancelFn({ data: { serverId, runId: tab.runId } }));
    }
    const remaining = tabs.filter((t) => t.id !== id);
    if (remaining.length === 0) {
      const fresh = newTab();
      setTabs([fresh]);
      setActiveId(fresh.id);
      return;
    }
    setTabs(remaining);
    if (id === activeId) setActiveId(remaining[0]?.id ?? "");
  };

  const clearTab = (tabId: string) => {
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, localLines: [] } : t)));
  };

  const submitLine = (tabId: string, line: string) => {
    if (line.trim() === "clear") {
      clearTab(tabId);
      return;
    }
    const argv = lineToArgv(line);
    if (argv.length === 0 || !online) return;
    setTabs((prev) =>
      appendLocal(prev, tabId, { id: crypto.randomUUID(), kind: "in", text: line }),
    );
    void (async () => {
      const { data, error } = await tryCatch(sendAgentRunFn({ data: { serverId, argv } }));
      if (error !== null) {
        const text = error instanceof Error ? error.message : "run failed";
        setTabs((prev) => appendLocal(prev, tabId, metaLine(text)));
        return;
      }
      if (!data.ok) {
        setTabs((prev) => appendLocal(prev, tabId, metaLine("session not connected")));
        return;
      }
      setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, runId: data.runId } : t)));
    })();
  };

  const cancelActive = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab?.runId) return;
    void tryCatch(sendAgentCancelFn({ data: { serverId, runId: tab.runId } }));
  };

  const clearRun = (tabId: string) => {
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, runId: null } : t)));
  };

  const markBusy = (tabId: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === tabId
          ? {
              ...t,
              runId: null,
              localLines: trimLines([...t.localLines, metaLine("busy — too many concurrent runs")]),
            }
          : t,
      ),
    );
  };

  const terminalTabs: Array<TerminalTabSpec> = tabs.map((tab) => ({
    id: tab.id,
    title: tab.runId ? `${tab.title} ·` : tab.title,
    content: (
      <TerminalTabPane
        tab={tab}
        db={db}
        onCancel={() => cancelActive(tab.id)}
        onRunFinished={() => clearRun(tab.id)}
        onBusy={() => markBusy(tab.id)}
      />
    ),
  }));

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold tracking-tight">Terminal</h2>
      <Terminal
        name={serverId}
        height="420px"
        tabs={terminalTabs}
        activeTabId={activeId}
        onActiveTabChange={setActiveId}
        onTabAdd={openTab}
        onTabClose={closeTab}
        onInput={online ? (line) => submitLine(activeId, line) : null}
        onClear={() => clearTab(activeId)}
      />
      {!online ? (
        <p className="mt-2 text-xs text-cool">
          Agent offline — connect the daemon to run commands.
        </p>
      ) : null}
    </section>
  );
}

type PaneProps = {
  tab: AgentTab;
  db: AgentDbHandle;
  onCancel: () => void;
  onRunFinished: () => void;
  onBusy: () => void;
};

function TerminalTabPane({ tab, db, onCancel, onRunFinished, onBusy }: PaneProps) {
  const live = useLiveQuery({
    query: (q) => {
      if (!db || !tab.runId) return null;
      return q
        .from({ s: db.collections.sample })
        .where(({ s }) => eq(s.runId, tab.runId))
        .orderBy(({ s }) => s.at, "asc");
    },
  });
  const remote = live.data ?? [];
  const lastRow = remote.length > 0 ? remote[remote.length - 1] : undefined;
  const lastSampleId = lastRow?.id;
  const lastPayloadJson = lastRow?.payloadJson;
  const seenFinishRef = useRef<string | null>(null);

  useEffect(() => {
    if (!tab.runId || !lastSampleId || !lastPayloadJson) return;
    if (seenFinishRef.current === lastSampleId) return;
    const payload = parseRunPayload(lastPayloadJson);
    if (!payload) return;
    if (payload.op !== "result" && payload.op !== "error") return;
    seenFinishRef.current = lastSampleId;
    if (payload.body?.busy) onBusy();
    else onRunFinished();
  }, [lastSampleId, lastPayloadJson, tab.runId, onBusy, onRunFinished]);

  useEffect(() => {
    seenFinishRef.current = null;
  }, [tab.runId]);

  const remoteLines = remote.flatMap((row) => {
    const payload = parseRunPayload(row.payloadJson);
    if (!payload) return [];
    return payloadToLines(payload, row.id ?? row.at);
  });

  const lines = trimLines([...tab.localLines, ...remoteLines]);

  return (
    <div>
      {tab.runId ? (
        <div className="mb-1 flex justify-end">
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            Cancel run
          </Button>
        </div>
      ) : null}
      {lines.map((line) =>
        line.kind === "in" ? (
          <TerminalInput key={line.id}>{line.text}</TerminalInput>
        ) : line.kind === "out" ? (
          <TerminalOutput key={line.id}>
            {line.stream === "stderr" ? `[err] ${line.text}` : line.text}
          </TerminalOutput>
        ) : (
          <TerminalOutput key={line.id} className="text-cool">
            {line.text}
          </TerminalOutput>
        ),
      )}
    </div>
  );
}
