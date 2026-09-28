import { createContext } from "react";
import type { EnvelopeHandler, SessionEnvelope, SessionWsStatus } from "./sessionWs";
import type { PaneApi } from "@/components/agent/pty/ptyTypes";

export type SessionWsContextValue = {
  serverId: string;
  ready: boolean;
  status: SessionWsStatus;
  send: (envelope: SessionEnvelope) => boolean;
  subscribe: (handler: EnvelopeHandler) => () => void;
  subscribeRun: (runId: string, handler: EnvelopeHandler) => () => void;
  setPane: (pane: PaneApi | null) => void;
  clearPane: () => void;
  fitAndResize: () => void;
};

export const SessionWsContext = createContext<SessionWsContextValue | null>(null);
