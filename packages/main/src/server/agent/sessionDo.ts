/** Agent session Durable Object — hibernatable WSS + collector alarm. */

import { nextUlid } from "@monrep/utils/ulid";
import { DurableObject } from "cloudflare:workers";
import { z } from "zod";
import {
  clearBrowserOwnedPtys,
  ownedPtyIds,
  ptyIdFromClosedResult,
  removeOwnedPtyFromBrowsers,
  trackBrowserPtyEnvelope,
} from "./browserPtyOwnership";
import { BrowserReplyRouter } from "./browserReplyRouter";
import { parseCollectorsJson } from "./catalog";
import {
  findDeviceCredByDeviceId,
  findRuntimeConfig,
  findServerById,
  loadAgentDb,
  loadAgentLiveDb,
} from "./db";
import { PRUNE_RETRY_DELAY_MS, pruneServerSamples } from "./samplePrune";
import { AgentTaggedError, agentErrorMessage, agentErrorStatus } from "./schemas";
import { verifyDeviceAccessToken } from "./service";
import type { SampleKindSchema } from "@/db/do/agent_live";
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
type SocketAttachment = { role: SocketRole; ptyIds?: Array<string> };

type SampleKind = z.infer<typeof SampleKindSchema>;

const collectorKind = (name: string): SampleKind => {
  if (name === "monitor" || name === "error" || name === "overload" || name === "health") {
    return name;
  }
  return "other";
};

type DueMap = Record<string, number>;

type PendingCollectorRun = {
  collector: string;
  kind: SampleKind;
  /** epoch ms when the run was sent */
  at: number;
};

type PendingInteractiveRun = {
  kind: "interactive";
  argv?: Array<string>;
  /** epoch ms when the run was sent */
  at: number;
};

type PendingRun = PendingCollectorRun | PendingInteractiveRun;

const PENDING_TTL_MS = 15 * 60 * 1000;

export class AgentSession extends DurableObject<Env> {
  private readonly browserReplyRouter = new BrowserReplyRouter();

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

  private async releaseBrowserOwnedPtys(ws: WebSocket): Promise<void> {
    const ptyIds = ownedPtyIds(ws);
    clearBrowserOwnedPtys(ws);
    await Promise.all(
      ptyIds.map((ptyId) =>
        this.sendEnvelope({
          v: PROTO_V,
          id: nextUlid(null),
          op: "pty.close",
          body: { pty_id: ptyId },
        }),
      ),
    );
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
    if (this.socketRole(ws) === "browser") {
      await this.releaseBrowserOwnedPtys(ws);
    }
    if (this.socketsWithRole("agent").length === 0) {
      await this.setPresence("offline");
      await this.ctx.storage.deleteAlarm();
    }
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("[agent-session] ws error", error);
    if (this.socketRole(ws) === "browser") {
      await this.releaseBrowserOwnedPtys(ws);
    }
  }

  async alarm(): Promise<void> {
    const meta = await this.sessionMeta();
    if (!meta || this.socketsWithRole("agent").length === 0) {
      await this.ctx.storage.deleteAlarm();
      return;
    }

    await this.expirePendingRuns();

    const [db, adb] = await Promise.all([loadAgentDb(), loadAgentLiveDb()]);
    try {
      const prune = await pruneServerSamples(adb, meta.serverId);
      const config = await findRuntimeConfig(db, meta.serverId);
      if (!config?.backgroundEnabled) {
        await this.scheduleNextAlarm(prune.hasMore ? PRUNE_RETRY_DELAY_MS : 30_000);
        return;
      }
      const collectors = parseCollectorsJson(config.collectorsJson);
      const due = (await this.ctx.storage.get<DueMap>("due")) ?? {};
      const now = Date.now();
      let nextDelayMs = 30_000;
      const dueRuns: Array<{
        name: string;
        runId: string;
        argv: Array<string>;
        kind: SampleKind;
      }> = [];

      for (const [name, spec] of Object.entries(collectors)) {
        if (!spec.enabled || spec.argv.length === 0) continue;
        const intervalMs = Math.max(5, spec.intervalSec) * 1000;
        nextDelayMs = Math.min(nextDelayMs, intervalMs);
        const last = due[name] ?? 0;
        if (now - last < intervalMs) continue;
        due[name] = now;
        dueRuns.push({
          name,
          runId: nextUlid(null),
          argv: spec.argv,
          kind: collectorKind(name),
        });
      }

      await Promise.all(
        dueRuns.map(async ({ name, runId, argv, kind }) => {
          await this.sendEnvelope({
            v: PROTO_V,
            id: runId,
            op: "run",
            body: { argv, collector: name },
          });
          await this.ctx.storage.put(`pending:${runId}`, {
            collector: name,
            kind,
            at: now,
          } satisfies PendingRun);
        }),
      );
      await this.ctx.storage.put("due", due);
      await this.scheduleNextAlarm(
        prune.hasMore ? Math.min(nextDelayMs, PRUNE_RETRY_DELAY_MS) : nextDelayMs,
      );
    } finally {
      db.close();
    }
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
    if (this.socketsWithRole("agent").length === 0) {
      return new Response(JSON.stringify({ error: "SessionNotConnected" }), { status: 409 });
    }
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ role: "browser", ptyIds: [] } satisfies SocketAttachment);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  private async onBrowserEnvelope(ws: WebSocket, envelope: Envelope): Promise<void> {
    switch (envelope.op) {
      case "pty.open":
      case "pty.data":
      case "pty.resize":
      case "pty.close": {
        if (envelope.op === "pty.open" || envelope.op === "pty.close") {
          trackBrowserPtyEnvelope(ws, envelope.op, envelope.id, envelope.body);
        }
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
        await this.setPresence("online");
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
        if (this.browserReplyRouter.shouldForwardResult(envelope)) {
          this.sendToBrowsers(envelope);
          this.browserReplyRouter.afterForwardResult(envelope);
          const body = envelope.body;
          if (body && typeof body === "object" && (body as { closed?: unknown }).closed === true) {
            const ptyId = ptyIdFromClosedResult(body, envelope.id);
            removeOwnedPtyFromBrowsers(this.socketsWithRole("browser"), ptyId);
          }
          break;
        }
        if (await this.forwardInteractive(envelope)) break;
        await this.persistSample(envelope);
        break;
      }
      case "event": {
        if (await this.forwardInteractive(envelope)) break;
        await this.persistSample(envelope);
        break;
      }
      case "agent.health": {
        await this.persistSample(envelope);
        break;
      }
      case "error": {
        console.error("[agent-session] agent error frame", envelope.body);
        if (this.browserReplyRouter.shouldForwardError(envelope)) {
          this.sendToBrowsers(envelope);
          this.browserReplyRouter.afterForwardError(envelope);
          break;
        }
        if (await this.forwardInteractive(envelope)) break;
        await this.persistSample(envelope);
        break;
      }
      default:
        break;
    }
  }

  /** Live ops: relay to browsers only; never open agent_live streams. */
  private async forwardInteractive(envelope: Envelope): Promise<boolean> {
    const pending = await this.ctx.storage.get<PendingRun>(`pending:${envelope.id}`);
    if (!pending || pending.kind !== "interactive") return false;
    this.sendToBrowsers(envelope);
    if (envelope.op === "result" || envelope.op === "error") {
      await this.ctx.storage.delete(`pending:${envelope.id}`);
    }
    return true;
  }

  private async persistSample(envelope: Envelope): Promise<void> {
    const meta = await this.sessionMeta();
    if (!meta) return;

    let kind: SampleKind = "other";
    let collector: string | undefined;
    if (envelope.op === "agent.health") {
      kind = "health";
    } else {
      const pending = await this.ctx.storage.get<PendingRun>(`pending:${envelope.id}`);
      if (pending?.kind === "interactive") return;
      if (pending) {
        kind = pending.kind;
        collector = pending.collector;
        if (envelope.op === "result" || envelope.op === "error") {
          await this.ctx.storage.delete(`pending:${envelope.id}`);
        }
      }
    }

    const db = await loadAgentLiveDb();
    try {
      await db.actions.upsertSample({
        serverId: meta.serverId,
        kind,
        at: new Date().toISOString(),
        runId: envelope.op === "agent.health" ? undefined : envelope.id,
        payloadJson: JSON.stringify({
          id: envelope.id,
          op: envelope.op,
          collector,
          body: envelope.body ?? null,
        }),
      }).isPersisted.promise;
    } finally {
      db.close();
    }
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
      await this.sendEnvelope({
        v: PROTO_V,
        id: nextUlid(null),
        op: "config",
        body: { autoUpdate },
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
