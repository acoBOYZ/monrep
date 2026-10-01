/** Agent session Durable Object — hibernatable WSS (metrics live on the agent). */

import { nextUlid } from "@monrep/utils/ulid";
import { DurableObject } from "cloudflare:workers";
import { z } from "zod";
import { BrowserReplyRouter } from "./browserReplyRouter";
import { findDeviceCredByDeviceId, findRuntimeConfig, findServerById, loadAgentDb } from "./db";
import { AgentTaggedError, agentErrorMessage, agentErrorStatus } from "./schemas";
import { verifyDeviceAccessToken } from "./service";
import { AuthEnvSchema } from "@/server/auth/schemas";

const PROTO_V = 1;

const OpSchema = z.enum([
  "hello",
  "heartbeat",
  "run",
  "cancel",
  "update",
  "config",
  "agent.health",
  "pty.open",
  "pty.data",
  "pty.resize",
  "pty.close",
  "metrics.query",
  "metrics.latest",
  "metrics.names",
  "events.query",
  "result",
  "error",
  "event",
]);

export const EnvelopeSchema = z.object({
  v: z.number().int(),
  id: z.string(),
  op: OpSchema,
  body: z.unknown().optional(),
});
export type Envelope = z.infer<typeof EnvelopeSchema>;

type SocketRole = "agent" | "browser";
type SocketAttachment = { role: SocketRole };

/** Heartbeat must not hammer Hyperdrive — presence at most every 5 minutes. */
const PRESENCE_MIN_INTERVAL_MS = 5 * 60 * 1000;

type PendingInteractiveRun = {
  kind: "interactive";
  argv?: Array<string>;
  /** epoch ms when the run was sent */
  at: number;
};

type PendingRun = PendingInteractiveRun;

const PENDING_TTL_MS = 15 * 60 * 1000;
const ALARM_IDLE_MS = 60_000;

export class AgentSession extends DurableObject<Env> {
  private readonly browserReplyRouter = new BrowserReplyRouter();
  private readonly pendingAgentReplies = new Map<string, (env: Envelope) => void>();

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/send" && request.method === "POST") {
      return this.handleSend(request);
    }
    if (
      url.pathname === "/browser-ws" &&
      request.headers.get("Upgrade")?.toLowerCase() === "websocket"
    ) {
      return this.handleBrowserUpgrade(request);
    }
    if (request.headers.get("Upgrade")?.toLowerCase() === "websocket") {
      return this.handleUpgrade(request);
    }
    return new Response("expected websocket or POST /send", { status: 400 });
  }

  private socketRole(ws: WebSocket): SocketRole {
    const attachment = ws.deserializeAttachment() as SocketAttachment | null;
    return attachment?.role === "browser" ? "browser" : "agent";
  }

  private socketsWithRole(role: SocketRole): Array<WebSocket> {
    return this.ctx.getWebSockets().filter((ws) => this.socketRole(ws) === role);
  }

  /** Dashboard / scheduler: push an envelope to the connected agent only. */
  async sendEnvelope(envelope: Envelope): Promise<{ ok: true } | { ok: false; error: string }> {
    const sockets = this.socketsWithRole("agent");
    if (sockets.length === 0) {
      return { ok: false, error: "SessionNotConnected" };
    }
    if (envelope.op === "run") {
      await this.markInteractivePending(envelope);
    }
    const payload = JSON.stringify(envelope);
    for (const ws of sockets) {
      try {
        ws.send(payload);
      } catch (e) {
        console.error("[agent-session] send failed", e);
      }
    }
    return { ok: true };
  }

  /** Interactive dashboard runs (no collector) — forward to browsers, never sample. */
  private async markInteractivePending(envelope: Envelope): Promise<void> {
    const body = envelope.body;
    if (!body || typeof body !== "object") return;
    const record = body as { collector?: unknown; argv?: unknown };
    if (typeof record.collector === "string" && record.collector.length > 0) return;
    const argv = Array.isArray(record.argv)
      ? record.argv.filter((item): item is string => typeof item === "string")
      : undefined;
    await this.ctx.storage.put(`pending:${envelope.id}`, {
      kind: "interactive",
      argv,
      at: Date.now(),
    } satisfies PendingInteractiveRun);
  }

  private closeAgentSockets(): void {
    for (const ws of this.socketsWithRole("agent")) {
      try {
        ws.close(1000, "replaced");
      } catch (e) {
        console.error("[agent-session] close agent socket failed", e);
      }
    }
  }

  private sendToBrowsers(envelope: Envelope): void {
    const payload = JSON.stringify(envelope);
    for (const ws of this.socketsWithRole("browser")) {
      try {
        ws.send(payload);
      } catch (e) {
        console.error("[agent-session] browser send failed", e);
      }
    }
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const text = typeof message === "string" ? message : new TextDecoder().decode(message);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      ws.send(
        JSON.stringify({
          v: PROTO_V,
          id: "parse",
          op: "error",
          body: { message: "invalid json" },
        }),
      );
      return;
    }
    const env = EnvelopeSchema.safeParse(parsed);
    if (!env.success) {
      ws.send(
        JSON.stringify({
          v: PROTO_V,
          id: "parse",
          op: "error",
          body: { message: "invalid envelope" },
        }),
      );
      return;
    }
    if (this.socketRole(ws) === "browser") {
      await this.onBrowserEnvelope(ws, env.data);
      return;
    }
    await this.onEnvelope(env.data);
  }

  async webSocketClose(
    ws: WebSocket,
    _code: number,
    _reason: string,
    _wasClean: boolean,
  ): Promise<void> {
    // Last browser gone → close agent PTYs (UI remount never reattaches; orphans waste slots).
    if (this.socketRole(ws) === "browser" && this.socketsWithRole("browser").length === 0) {
      const closes = this.browserReplyRouter.drainActivePtyIds().map((ptyId) =>
        this.sendEnvelope({
          v: PROTO_V,
          id: nextUlid(null),
          op: "pty.close",
          body: { pty_id: ptyId },
        }),
      );
      await Promise.all(closes);
    }
    if (this.socketsWithRole("agent").length === 0) {
      await this.setPresence("offline");
      await this.ctx.storage.deleteAlarm();
    }
  }

  webSocketError(_ws: WebSocket, error: unknown): void {
    console.error("[agent-session] ws error", error);
  }

  /** Send to agent and wait for matching result/error (fleet metrics.latest). */
  async requestFromAgent(envelope: Envelope, timeoutMs = 8_000): Promise<Envelope | null> {
    return await new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pendingAgentReplies.delete(envelope.id);
        resolve(null);
      }, timeoutMs);
      this.pendingAgentReplies.set(envelope.id, (env) => {
        clearTimeout(timer);
        this.pendingAgentReplies.delete(envelope.id);
        resolve(env);
      });
      void this.sendEnvelope(envelope).then((result) => {
        if (!result.ok) {
          clearTimeout(timer);
          this.pendingAgentReplies.delete(envelope.id);
          resolve(null);
        }
      });
    });
  }

  private settleAgentReply(envelope: Envelope): boolean {
    const waiter = this.pendingAgentReplies.get(envelope.id);
    if (!waiter) return false;
    waiter(envelope);
    return true;
  }

  async alarm(): Promise<void> {
    const meta = await this.sessionMeta();
    if (!meta || this.socketsWithRole("agent").length === 0) {
      await this.ctx.storage.deleteAlarm();
      return;
    }
    await this.expirePendingRuns();
    await this.scheduleNextAlarm(ALARM_IDLE_MS);
  }

  private async handleUpgrade(request: Request): Promise<Response> {
    const auth = request.headers.get("Authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "InvalidAccessToken", message: "Missing bearer" }),
        {
          status: 401,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const parsedEnv = AuthEnvSchema.pick({ SESSION_SECRET: true }).safeParse(this.env);
    if (!parsedEnv.success) {
      return new Response("misconfigured", { status: 500 });
    }

    let deviceId: string;
    let serverId: string;
    try {
      const access = await verifyDeviceAccessToken(token, parsedEnv.data.SESSION_SECRET);
      deviceId = access.deviceId;
      serverId = access.serverId;
    } catch (e) {
      if (e instanceof AgentTaggedError) {
        return new Response(
          JSON.stringify({ error: e.error._tag, message: agentErrorMessage(e.error) }),
          { status: agentErrorStatus(e.error), headers: { "content-type": "application/json" } },
        );
      }
      throw e;
    }

    const expectedName = this.ctx.id.name;
    if (expectedName && expectedName !== deviceId) {
      return new Response(JSON.stringify({ error: "DeviceUnknown", message: "device mismatch" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const db = await loadAgentDb();
    try {
      const cred = await findDeviceCredByDeviceId(db, deviceId);
      if (!cred || cred.revokedAt || cred.serverId !== serverId) {
        throw new AgentTaggedError({ _tag: "DeviceUnknown" });
      }
    } catch (e) {
      if (e instanceof AgentTaggedError) {
        return new Response(
          JSON.stringify({ error: e.error._tag, message: agentErrorMessage(e.error) }),
          { status: agentErrorStatus(e.error), headers: { "content-type": "application/json" } },
        );
      }
      throw e;
    } finally {
      db.close();
    }

    this.closeAgentSockets();

    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ role: "agent" } satisfies SocketAttachment);
    await this.ctx.storage.put("meta", { deviceId, serverId });
    await this.setPresence("online");
    await this.scheduleNextAlarm(5_000);

    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  /** Browser PTY bridge — auth already enforced by the Worker before stub.fetch. */
  private async handleBrowserUpgrade(request: Request): Promise<Response> {
    const serverId = new URL(request.url).searchParams.get("serverId");
    if (!serverId) {
      return new Response(JSON.stringify({ error: "serverId required" }), { status: 400 });
    }
    const meta = await this.sessionMeta();
    if (meta && meta.serverId !== serverId) {
      return new Response(JSON.stringify({ error: "server mismatch" }), { status: 403 });
    }
    const agentCount = this.socketsWithRole("agent").length;
    if (agentCount === 0) {
      return new Response(JSON.stringify({ error: "SessionNotConnected" }), { status: 409 });
    }
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ role: "browser" } satisfies SocketAttachment);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  private async onBrowserEnvelope(_ws: WebSocket, envelope: Envelope): Promise<void> {
    switch (envelope.op) {
      case "pty.open":
      case "pty.data":
      case "pty.resize":
      case "pty.close":
      case "metrics.query":
      case "metrics.latest":
      case "metrics.names":
      case "events.query": {
        this.browserReplyRouter.trackBrowserEnvelope(envelope);
        const result = await this.sendEnvelope(envelope);
        if (!result.ok) {
          this.sendToBrowsers({
            v: PROTO_V,
            id: envelope.id,
            op: "error",
            body: { message: "agent not connected" },
          });
        }
        return;
      }
      default:
        this.sendToBrowsers({
          v: PROTO_V,
          id: envelope.id,
          op: "error",
          body: { message: "op not allowed from browser" },
        });
    }
  }

  private async handleSend(request: Request): Promise<Response> {
    const body = EnvelopeSchema.safeParse(await request.json());
    if (!body.success) {
      return new Response(JSON.stringify({ error: "invalid_body" }), { status: 400 });
    }
    const result = await this.sendEnvelope(body.data);
    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error, message: "not connected" }), {
        status: 409,
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  private async onEnvelope(envelope: Envelope): Promise<void> {
    switch (envelope.op) {
      case "hello": {
        // Do not ACK with op "result" on the agent socket — agent treats inbound
        // Result as illegal and replies with Error (feedback storm → Miniflare die).
        await this.setPresence("online");
        await this.persistAgentVersion(envelope);
        await this.pushAgentConfig();
        break;
      }
      case "heartbeat": {
        await this.touchPresenceIfDue();
        break;
      }
      case "pty.data":
      case "pty.open":
      case "pty.resize":
      case "pty.close": {
        this.sendToBrowsers(envelope);
        break;
      }
      case "result": {
        if (this.settleAgentReply(envelope)) break;
        if (this.browserReplyRouter.shouldForwardResult(envelope)) {
          this.sendToBrowsers(envelope);
          this.browserReplyRouter.afterForwardResult(envelope);
          break;
        }
        await this.forwardInteractive(envelope);
        break;
      }
      case "event": {
        if (await this.forwardInteractive(envelope)) break;
        break;
      }
      case "agent.health": {
        // Health is stored on the agent SQLite; ignore for CF streams.
        break;
      }
      case "error": {
        console.error("[agent-session] agent error frame", envelope.body);
        if (this.settleAgentReply(envelope)) break;
        if (this.browserReplyRouter.shouldForwardError(envelope)) {
          this.sendToBrowsers(envelope);
          this.browserReplyRouter.afterForwardError(envelope);
          break;
        }
        await this.forwardInteractive(envelope);
        break;
      }
      default:
        break;
    }
  }

  /** Live ops: relay to browsers only. */
  private async forwardInteractive(envelope: Envelope): Promise<boolean> {
    const pending = await this.ctx.storage.get<PendingRun>(`pending:${envelope.id}`);
    if (!pending) return false;
    this.sendToBrowsers(envelope);
    if (envelope.op !== "event") {
      await this.ctx.storage.delete(`pending:${envelope.id}`);
    }
    return true;
  }

  private async persistAgentVersion(envelope: Envelope): Promise<void> {
    const body = envelope.body;
    if (!body || typeof body !== "object") return;
    const version = (body as { agent_version?: unknown }).agent_version;
    if (typeof version !== "string" || version.length === 0) return;
    const meta = await this.sessionMeta();
    if (!meta) return;
    const db = await loadAgentDb();
    try {
      const server = await findServerById(db, meta.serverId);
      if (!server?.id || server.status === "revoked") return;
      await db.actions.upsertServer({
        id: server.id,
        name: server.name,
        deviceId: server.deviceId ?? meta.deviceId,
        status: server.status === "pending" ? "online" : server.status,
        lastSeenAt: server.lastSeenAt,
        agentVersion: version,
        createdAt: server.createdAt,
      }).isPersisted.promise;
    } finally {
      db.close();
    }
  }

  private async touchPresenceIfDue(): Promise<void> {
    const last = await this.ctx.storage.get<number>("lastPresenceAt");
    const now = Date.now();
    if (typeof last === "number" && now - last < PRESENCE_MIN_INTERVAL_MS) return;
    await this.setPresence("online");
  }

  private async setPresence(status: "online" | "offline"): Promise<void> {
    const meta = await this.sessionMeta();
    if (!meta) return;
    const db = await loadAgentDb();
    try {
      const server = await findServerById(db, meta.serverId);
      if (!server?.id || server.status === "revoked") return;
      if (server.deviceId && server.deviceId !== meta.deviceId) return;
      const now = new Date().toISOString();
      await db.actions.upsertServer({
        id: server.id,
        name: server.name,
        deviceId: server.deviceId ?? meta.deviceId,
        status,
        lastSeenAt: now,
        agentVersion: server.agentVersion,
        createdAt: server.createdAt,
      }).isPersisted.promise;
      if (status === "online") {
        await this.ctx.storage.put("lastPresenceAt", Date.now());
      } else {
        await this.ctx.storage.delete("lastPresenceAt");
      }
    } finally {
      db.close();
    }
  }

  private async pushAgentConfig(): Promise<void> {
    const meta = await this.sessionMeta();
    if (!meta) return;
    const db = await loadAgentDb();
    try {
      const config = await findRuntimeConfig(db, meta.serverId);
      const autoUpdate = config?.autoUpdate ?? true;
      const metricsEnabled = config?.backgroundEnabled ?? true;
      const metricsIntervalSec = config?.metricsIntervalSec ?? 30;
      await this.sendEnvelope({
        v: PROTO_V,
        id: nextUlid(null),
        op: "config",
        body: { autoUpdate, metricsEnabled, metricsIntervalSec },
      });
    } finally {
      db.close();
    }
  }

  private async sessionMeta(): Promise<{ deviceId: string; serverId: string } | undefined> {
    return this.ctx.storage.get<{ deviceId: string; serverId: string }>("meta");
  }

  /** Drop stale pending:* keys so DO storage cannot grow forever. */
  private async expirePendingRuns(): Promise<void> {
    const now = Date.now();
    const listed = await this.ctx.storage.list<PendingRun>({ prefix: "pending:" });
    const stale: Array<string> = [];
    for (const [key, value] of listed) {
      const at = typeof value.at === "number" ? value.at : 0;
      if (now - at >= PENDING_TTL_MS) stale.push(key);
    }
    if (stale.length > 0) await this.ctx.storage.delete(stale);
  }

  private async scheduleNextAlarm(delayMs: number): Promise<void> {
    const when = Date.now() + Math.max(1_000, delayMs);
    await this.ctx.storage.setAlarm(when);
  }
}

export const getAgentSessionStub = (env: Env, deviceId: string) =>
  env.AGENT_SESSIONS.getByName(deviceId);
