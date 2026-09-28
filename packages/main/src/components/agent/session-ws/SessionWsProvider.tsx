import { useCallback, useEffect, useMemo, useState } from "react";
import { cancelSessionWsDestroy, getSessionWs, scheduleSessionWsDestroy } from "./sessionWs";
import { SessionWsContext } from "./sessionWsContext";
import type { ReactNode } from "react";
import type { EnvelopeHandler, SessionEnvelope, SessionWsStatus } from "./sessionWs";
import type { SessionWsContextValue } from "./sessionWsContext";
import type { PaneApi } from "@/components/agent/pty/ptyTypes";

type SessionWsProviderProps = {
  serverId: string;
  children: ReactNode;
};

export function SessionWsProvider({ serverId, children }: SessionWsProviderProps) {
  const client = getSessionWs(serverId);
  const [ready, setReady] = useState(client.ready);
  const [status, setStatus] = useState<SessionWsStatus>(client.status);

  useEffect(() => {
    cancelSessionWsDestroy(serverId);
    const c = getSessionWs(serverId);
    c.open();
    const onStatus = (nextReady: boolean, nextStatus: SessionWsStatus) => {
      setReady(nextReady);
      setStatus(nextStatus);
    };
    c.onStatus(onStatus);
    return () => {
      c.offStatus(onStatus);
      scheduleSessionWsDestroy(serverId);
    };
  }, [serverId]);

  const send = useCallback(
    (envelope: SessionEnvelope) => getSessionWs(serverId).send(envelope),
    [serverId],
  );
  const subscribe = useCallback(
    (handler: EnvelopeHandler) => getSessionWs(serverId).subscribe(handler),
    [serverId],
  );
  const subscribeRun = useCallback(
    (runId: string, handler: EnvelopeHandler) =>
      getSessionWs(serverId).subscribeRun(runId, handler),
    [serverId],
  );
  const setPane = useCallback(
    (pane: PaneApi | null) => getSessionWs(serverId).setPane(pane),
    [serverId],
  );
  const clearPane = useCallback(() => {
    getSessionWs(serverId).pane?.clear();
  }, [serverId]);
  const fitAndResize = useCallback(() => {
    getSessionWs(serverId).pane?.fitAndResize();
  }, [serverId]);

  const value = useMemo<SessionWsContextValue>(
    () => ({
      serverId,
      ready,
      status,
      send,
      subscribe,
      subscribeRun,
      setPane,
      clearPane,
      fitAndResize,
    }),
    [serverId, ready, status, send, subscribe, subscribeRun, setPane, clearPane, fitAndResize],
  );

  return <SessionWsContext.Provider value={value}>{children}</SessionWsContext.Provider>;
}
