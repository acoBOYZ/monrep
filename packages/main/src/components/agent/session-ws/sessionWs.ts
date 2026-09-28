import { base64ToBytes } from "@monrep/utils";
import type { PaneApi } from "@/components/agent/pty/ptyTypes";

const DESTROY_DELAY_MS = 80;

export type SessionEnvelope = {
  v: number;
  id: string;
  op: string;
  body?: {
    ok?: boolean;
    pty_id?: string;
    data?: string;
    message?: string;
    closed?: boolean;
    busy?: boolean;
    cols?: number;
    rows?: number;
    line?: string;
    stream?: string;
  };
};

export type SessionWsStatus = "connecting" | "connected" | "ready" | "disconnected" | "error";

type StatusListener = (ready: boolean, status: SessionWsStatus) => void;
export type EnvelopeHandler = (envelope: SessionEnvelope) => void;

class SessionWsClient {
  readonly serverId: string;
  pane: PaneApi | null = null;
  ready = false;
  status: SessionWsStatus = "connecting";

  private ws: WebSocket | null = null;
  /** Envelope id of the outstanding/active `pty.open` (same id used as pty_id). */
  private activePtyOpenId: string | null = null;
  private readonly statusListeners = new Set<StatusListener>();
  private readonly envelopeListeners = new Set<EnvelopeHandler>();
  private readonly runListeners = new Map<string, Set<EnvelopeHandler>>();

  constructor(serverId: string) {
    this.serverId = serverId;
  }

  onStatus(listener: StatusListener): void {
    this.statusListeners.add(listener);
    listener(this.ready, this.status);
  }

  offStatus(listener: StatusListener): void {
    this.statusListeners.delete(listener);
  }

  subscribe(handler: EnvelopeHandler): () => void {
    this.envelopeListeners.add(handler);
    return () => {
      this.envelopeListeners.delete(handler);
    };
  }

  subscribeRun(runId: string, handler: EnvelopeHandler): () => void {
    let set = this.runListeners.get(runId);
    if (!set) {
      set = new Set();
      this.runListeners.set(runId, set);
    }
    set.add(handler);
    return () => {
      const current = this.runListeners.get(runId);
      if (!current) return;
      current.delete(handler);
      if (current.size === 0) this.runListeners.delete(runId);
    };
  }

  setPane(pane: PaneApi | null): void {
    this.pane = pane;
    if (!pane) this.activePtyOpenId = null;
  }

  open(): void {
    if (typeof window === "undefined") return;
    const existing = this.ws;
    if (
      existing &&
      (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.setStatus("connecting", false);
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//${window.location.host}/api/agent/session-ws?serverId=${encodeURIComponent(this.serverId)}`;
    const ws = new WebSocket(wsUrl);
    this.ws = ws;

    ws.onopen = () => {
      if (this.ws !== ws) return;
      this.setStatus("connected", true);
    };

    ws.onmessage = (ev) => {
      if (this.ws !== ws) return;
      this.onMessage(ev);
    };

    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      this.setStatus("disconnected", false);
      this.pane?.writeln("\r\n[disconnected]");
    };

    ws.onerror = () => {
      if (this.ws !== ws) return;
      this.setStatus("error", this.ready);
    };
  }

  send(envelope: SessionEnvelope): boolean {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    if (envelope.op === "pty.open") this.activePtyOpenId = envelope.id;
    if (envelope.op === "pty.close") this.activePtyOpenId = null;
    ws.send(JSON.stringify(envelope));
    return true;
  }

  destroy(): void {
    const ws = this.ws;
    this.ws = null;
    this.pane = null;
    this.activePtyOpenId = null;
    this.statusListeners.clear();
    this.envelopeListeners.clear();
    this.runListeners.clear();
    this.ready = false;
    this.status = "disconnected";
    if (!ws) return;
    ws.onopen = null;
    ws.onmessage = null;
    ws.onclose = null;
    ws.onerror = null;
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  }

  private setStatus(status: SessionWsStatus, ready: boolean): void {
    this.status = status;
    this.ready = ready;
    for (const listener of this.statusListeners) {
      listener(ready, status);
    }
  }

  private onMessage(ev: MessageEvent): void {
    let env: SessionEnvelope;
    try {
      env = JSON.parse(String(ev.data)) as SessionEnvelope;
    } catch {
      return;
    }

    for (const handler of this.envelopeListeners) {
      handler(env);
    }
    const runSet = this.runListeners.get(env.id);
    if (runSet) {
      for (const handler of runSet) {
        handler(env);
      }
    }

    this.handlePtyEnvelope(env);
  }

  private handlePtyEnvelope(env: SessionEnvelope): void {
    if (env.op === "pty.data" && typeof env.body?.data === "string") {
      const pane = paneMatches(this.pane, env) ? this.pane : null;
      pane?.write(base64ToBytes(env.body.data));
      return;
    }

    if (env.op !== "result" && env.op !== "error") return;
    if (!this.isPtyControlEnvelope(env)) return;

    const pane = this.pane;
    if (env.op === "result") {
      if (env.body?.ok && typeof env.body.pty_id === "string") {
        this.setStatus("ready", true);
      }
      if (env.body?.closed) pane?.writeln("\r\n[pty closed]");
      if (env.body?.busy) pane?.writeln("\r\n[pty busy]");
      if (env.body?.ok === false && env.body.message) {
        pane?.writeln(`\r\n[error] ${env.body.message}`);
        this.setStatus("error", this.ready);
      }
      return;
    }

    if (env.body?.message) {
      pane?.writeln(`\r\n[error] ${env.body.message}`);
      this.setStatus("error", this.ready);
    }
  }

  /** Ops run result/error share the socket — only react when this is our PTY open. */
  private isPtyControlEnvelope(env: SessionEnvelope): boolean {
    if (this.activePtyOpenId && env.id === this.activePtyOpenId) return true;
    return paneMatches(this.pane, env);
  }
}

const clients = new Map<string, SessionWsClient>();
const pendingDestroy = new Map<string, ReturnType<typeof setTimeout>>();

export const getSessionWs = (serverId: string): SessionWsClient => {
  let client = clients.get(serverId);
  if (!client) {
    client = new SessionWsClient(serverId);
    clients.set(serverId, client);
  }
  return client;
};

export const cancelSessionWsDestroy = (serverId: string): void => {
  const timer = pendingDestroy.get(serverId);
  if (timer === undefined) return;
  clearTimeout(timer);
  pendingDestroy.delete(serverId);
};

/** Schedule destroy; cancelled if Provider remounts (Strict Mode). */
export const scheduleSessionWsDestroy = (serverId: string): void => {
  cancelSessionWsDestroy(serverId);
  const timer = setTimeout(() => {
    pendingDestroy.delete(serverId);
    const client = clients.get(serverId);
    if (!client) return;
    client.destroy();
    clients.delete(serverId);
  }, DESTROY_DELAY_MS);
  pendingDestroy.set(serverId, timer);
};

const paneMatches = (pane: PaneApi | null, env: SessionEnvelope): pane is PaneApi => {
  if (!pane) return false;
  const id = pane.getPtyId();
  if (!id) return false;
  const ptyId = typeof env.body?.pty_id === "string" ? env.body.pty_id : null;
  return id === ptyId || id === env.id;
};
