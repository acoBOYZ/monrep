import { useCallback, useEffect, useRef, useState } from "react";
import { tryCatch } from "@monrep/utils";
import type { SessionEnvelope } from "@/components/agent/session-ws/sessionWs";
import { getSessionWs } from "@/components/agent/session-ws/sessionWs";
import { useSessionWs } from "@/components/agent/session-ws/useSessionWs";
import { sendAgentCancelFn, sendAgentRunFn } from "@/server/agent/functions";

type Waiter = {
  resolve: (lines: Array<string>) => void;
  reject: (error: Error) => void;
  lines: Array<string>;
};

const READY_TIMEOUT_MS = 10_000;

const waitSessionWsReady = (serverId: string): Promise<void> => {
  const client = getSessionWs(serverId);
  client.open();
  if (client.ready) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.offStatus(onStatus);
      reject(new Error("session ws not ready"));
    }, READY_TIMEOUT_MS);
    const onStatus = (ready: boolean) => {
      if (!ready) return;
      clearTimeout(timer);
      client.offStatus(onStatus);
      resolve();
    };
    client.onStatus(onStatus);
  });
};

const appendEventLine = (lines: Array<string>, envelope: SessionEnvelope): Array<string> => {
  const line = envelope.body?.line;
  if (typeof line !== "string") return lines;
  const next = envelope.body?.stream === "stderr" ? [...lines, `[err] ${line}`] : [...lines, line];
  return next.length > 500 ? next.slice(-500) : next;
};

const applyTerminal = (lines: Array<string>, envelope: SessionEnvelope): Array<string> => {
  if (envelope.body?.busy) return [...lines, "busy"];
  if (envelope.body?.message) return [...lines, envelope.body.message];
  return lines;
};

/**
 * Ops runs over session-ws: start via sendAgentRunFn, stream event/result/error by runId.
 * Must be used inside SessionWsProvider.
 */
export function useSessionRun(serverId: string) {
  const { subscribeRun } = useSessionWs();
  const [runId, setRunId] = useState<string | null>(null);
  const [lines, setLines] = useState<Array<string>>([]);
  const [finished, setFinished] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const waitersRef = useRef(new Map<string, Waiter>());
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const waiters = waitersRef.current;
    const unsubHolder = unsubRef;
    return () => {
      unsubHolder.current?.();
      unsubHolder.current = null;
      for (const [, waiter] of waiters) {
        waiter.reject(new Error("unmounted"));
      }
      waiters.clear();
    };
  }, []);

  const attachRun = useCallback(
    (id: string) => {
      unsubRef.current?.();
      unsubRef.current = subscribeRun(id, (envelope) => {
        const waiter = waitersRef.current.get(id);
        if (envelope.op === "event") {
          const base = waiter?.lines ?? [];
          const next = appendEventLine(base, envelope);
          if (waiter) waiter.lines = next;
          setLines(next);
          return;
        }
        if (envelope.op === "result" || envelope.op === "error") {
          const base = waiter?.lines ?? [];
          const next = applyTerminal(base, envelope);
          if (waiter) waiter.lines = next;
          setLines(next);
          setFinished(true);
          unsubRef.current?.();
          unsubRef.current = null;
          if (waiter) {
            waitersRef.current.delete(id);
            waiter.resolve(next);
          }
        }
      });
    },
    [subscribeRun],
  );

  const runAsync = useCallback(
    async (argv: Array<string>): Promise<Array<string>> => {
      await Promise.resolve();

      for (const [id, waiter] of waitersRef.current) {
        waitersRef.current.delete(id);
        waiter.reject(new Error("superseded"));
      }
      unsubRef.current?.();
      unsubRef.current = null;

      setError(null);
      setLines([]);
      setFinished(false);
      setRunId(null);

      try {
        await waitSessionWsReady(serverId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "session ws not ready";
        setError(message);
        setFinished(true);
        throw err instanceof Error ? err : new Error(message);
      }

      const { data, error: err } = await tryCatch(sendAgentRunFn({ data: { serverId, argv } }));
      if (err !== null) {
        const message = err instanceof Error ? err.message : "run failed";
        setError(message);
        setFinished(true);
        throw err instanceof Error ? err : new Error(message);
      }
      if (!data.ok) {
        setError("session not connected");
        setFinished(true);
        throw new Error("session not connected");
      }

      return await new Promise<Array<string>>((resolve, reject) => {
        waitersRef.current.set(data.runId, { resolve, reject, lines: [] });
        setRunId(data.runId);
        attachRun(data.runId);
      });
    },
    [serverId, attachRun],
  );

  const run = useCallback(
    (argv: Array<string>) => {
      void runAsync(argv).catch(() => {
        /* error already in state */
      });
    },
    [runAsync],
  );

  const cancel = useCallback(() => {
    if (!runId || finished) return;
    const waiter = waitersRef.current.get(runId);
    if (waiter) {
      waitersRef.current.delete(runId);
      waiter.reject(new Error("cancelled"));
    }
    unsubRef.current?.();
    unsubRef.current = null;
    setFinished(true);
    void tryCatch(sendAgentCancelFn({ data: { serverId, runId } }));
  }, [serverId, runId, finished]);

  const busy = runId !== null && !finished;

  return { lines, finished, error, busy, runId, run, runAsync, cancel, setError };
}
