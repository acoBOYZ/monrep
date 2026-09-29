import { nextUlid } from "@monrep/utils/ulid";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { z } from "zod";
import type { Envelope } from "@/server/agent/sessionDo";
import { findServerById, loadAgentDb } from "@/server/agent/db";
import { AgentTaggedError, CreateServerInputSchema } from "@/server/agent/schemas";
import {
  createServerWithEnrollToken,
  listFleetServers,
  revokeServer,
} from "@/server/agent/service";
import { getAgentSessionStub } from "@/server/agent/sessionDo";
import { requireSession } from "@/server/auth/functions";
import { err, ok } from "@/server/result";

const RevokeServerInputSchema = z.object({
  serverId: z.string().min(1),
});

const SendAgentRunInputSchema = z.object({
  serverId: z.string().min(1),
  argv: z.array(z.string()).min(1),
});

const CancelAgentRunInputSchema = z.object({
  serverId: z.string().min(1),
  runId: z.string().min(1),
});

const PushAgentConfigInputSchema = z.object({
  serverId: z.string().min(1),
  autoUpdate: z.boolean().optional(),
  metricsEnabled: z.boolean().optional(),
  metricsIntervalSec: z.number().int().positive().optional(),
});

const MetricsLatestInputSchema = z.object({
  serverId: z.string().min(1),
  names: z.array(z.string()).optional(),
});

const ServerIdInputSchema = z.object({
  serverId: z.string().min(1),
});

export const listServersFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireSession();
  const servers = await listFleetServers();
  return { servers };
});

export const createFleetServerFn = createServerFn({ method: "POST" })
  .validator(CreateServerInputSchema)
  .handler(async ({ data }) => {
    await requireSession();
    const minted = await createServerWithEnrollToken(data.name);
    return {
      server: minted.server,
      enrollToken: minted.enrollToken,
      expiresAt: minted.expiresAt,
    };
  });

export const revokeServerFn = createServerFn({ method: "POST" })
  .validator(RevokeServerInputSchema)
  .handler(async ({ data }) => {
    await requireSession();
    await revokeServer(data.serverId);
    return { ok: true as const };
  });

export const sendAgentRunFn = createServerFn({ method: "POST" })
  .validator(SendAgentRunInputSchema)
  .handler(async ({ data }) => {
    await requireSession();
    const db = await loadAgentDb();
    try {
      const server = await findServerById(db, data.serverId);
      if (!server?.id) throw new AgentTaggedError({ _tag: "ServerNotFound" });
      if (!server.deviceId) throw new AgentTaggedError({ _tag: "MissingDevice" });
      const runId = nextUlid(null);
      const stub = getAgentSessionStub(env, server.deviceId);
      const result = await stub.sendEnvelope({
        v: 1,
        id: runId,
        op: "run",
        body: { argv: data.argv },
      });
      if (!result.ok) {
        return err({ _tag: "SessionNotConnected" as const });
      }
      return ok({ runId });
    } finally {
      db.close();
    }
  });

export const sendAgentCancelFn = createServerFn({ method: "POST" })
  .validator(CancelAgentRunInputSchema)
  .handler(async ({ data }) => {
    await requireSession();
    const db = await loadAgentDb();
    try {
      const server = await findServerById(db, data.serverId);
      if (!server?.id) throw new AgentTaggedError({ _tag: "ServerNotFound" });
      if (!server.deviceId) throw new AgentTaggedError({ _tag: "MissingDevice" });
      const stub = getAgentSessionStub(env, server.deviceId);
      const result = await stub.sendEnvelope({
        v: 1,
        id: nextUlid(null),
        op: "cancel",
        body: { run_id: data.runId },
      });
      if (!result.ok) {
        return err({ _tag: "SessionNotConnected" as const });
      }
      return ok({ cancelled: true as const });
    } finally {
      db.close();
    }
  });

export const pushAgentConfigFn = createServerFn({ method: "POST" })
  .validator(PushAgentConfigInputSchema)
  .handler(async ({ data }) => {
    await requireSession();
    const db = await loadAgentDb();
    try {
      const server = await findServerById(db, data.serverId);
      if (!server?.id) throw new AgentTaggedError({ _tag: "ServerNotFound" });
      if (!server.deviceId) return ok();
      const stub = getAgentSessionStub(env, server.deviceId);
      await stub.sendEnvelope({
        v: 1,
        id: nextUlid(null),
        op: "config",
        body: {
          autoUpdate: data.autoUpdate,
          metricsEnabled: data.metricsEnabled,
          metricsIntervalSec: data.metricsIntervalSec,
        },
      });
      return ok();
    } finally {
      db.close();
    }
  });

export const fetchMetricsLatestFn = createServerFn({ method: "POST" })
  .validator(MetricsLatestInputSchema)
  .handler(async ({ data }) => {
    await requireSession();
    const db = await loadAgentDb();
    try {
      const server = await findServerById(db, data.serverId);
      if (!server?.id) throw new AgentTaggedError({ _tag: "ServerNotFound" });
      if (!server.deviceId) return err({ _tag: "SessionNotConnected" as const });
      const stub = getAgentSessionStub(env, server.deviceId);
      const id = nextUlid(null);
      const reply = (await stub.requestFromAgent({
        v: 1,
        id,
        op: "metrics.latest",
        body: { names: data.names },
      })) as Envelope | null;
      if (!reply || reply.op === "error") {
        return err({ _tag: "SessionNotConnected" as const });
      }
      return ok({ body: reply.body ?? null });
    } finally {
      db.close();
    }
  });

export const sendAgentUpdateFn = createServerFn({ method: "POST" })
  .validator(ServerIdInputSchema)
  .handler(async ({ data }) => {
    await requireSession();
    const db = await loadAgentDb();
    try {
      const server = await findServerById(db, data.serverId);
      if (!server?.id) throw new AgentTaggedError({ _tag: "ServerNotFound" });
      if (!server.deviceId) throw new AgentTaggedError({ _tag: "MissingDevice" });
      const stub = getAgentSessionStub(env, server.deviceId);
      const result = await stub.sendEnvelope({
        v: 1,
        id: nextUlid(null),
        op: "update",
        body: {},
      });
      if (!result.ok) {
        return err({ _tag: "SessionNotConnected" as const });
      }
      return ok({ requested: true as const });
    } finally {
      db.close();
    }
  });
