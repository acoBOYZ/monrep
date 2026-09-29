import { eq, queryOnce } from "@tanstack/react-db";
import type { TDeviceCredDo, TEnrollTokenDo, TRuntimeConfigDo, TServerDo } from "@/db/types";
import { DO_MODULE_DB_FACTORIES } from "@/db/collections";
import { bindDoApp } from "@/db/host";
import { openServerStream } from "@/server/doStream";

bindDoApp();

export type AgentDb = Awaited<ReturnType<typeof loadAgentDb>>;

export const loadAgentDb = async () => {
  const stream = await openServerStream("agent");
  const db = DO_MODULE_DB_FACTORIES.agent({ stream });
  await db.preload();
  return db;
};

export const listServers = async (db: AgentDb): Promise<Array<TServerDo>> =>
  queryOnce({
    query: (q) => q.from({ s: db.collections.server }),
  });

export const findServerById = async (db: AgentDb, id: string): Promise<TServerDo | undefined> =>
  queryOnce({
    query: (q) =>
      q
        .from({ s: db.collections.server })
        .where(({ s }) => eq(s.id, id))
        .findOne(),
  });

export const findEnrollTokenByHash = async (
  db: AgentDb,
  tokenHash: string,
): Promise<TEnrollTokenDo | undefined> =>
  queryOnce({
    query: (q) =>
      q
        .from({ t: db.collections.enroll_token })
        .where(({ t }) => eq(t.tokenHash, tokenHash))
        .findOne(),
  });

export const listEnrollTokensByServerId = async (
  db: AgentDb,
  serverId: string,
): Promise<Array<TEnrollTokenDo>> =>
  queryOnce({
    query: (q) =>
      q.from({ t: db.collections.enroll_token }).where(({ t }) => eq(t.serverId, serverId)),
  });

export const findDeviceCredByDeviceId = async (
  db: AgentDb,
  deviceId: string,
): Promise<TDeviceCredDo | undefined> =>
  queryOnce({
    query: (q) =>
      q
        .from({ d: db.collections.device_cred })
        .where(({ d }) => eq(d.deviceId, deviceId))
        .findOne(),
  });

export const findRuntimeConfig = async (
  db: AgentDb,
  serverId: string,
): Promise<TRuntimeConfigDo | undefined> =>
  queryOnce({
    query: (q) =>
      q
        .from({ r: db.collections.runtime_config })
        .where(({ r }) => eq(r.serverId, serverId))
        .findOne(),
  });
