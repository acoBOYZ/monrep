import {
  randomToken,
  sha256Hex,
  signHmacJson,
  timingSafeEqualHex,
  verifyHmacJson,
} from "@monrep/utils";
import { nextUlid } from "@monrep/utils/ulid";
import { defaultCollectorsJson } from "./catalog";
import {
  findDeviceCredByDeviceId,
  findEnrollTokenByHash,
  findServerById,
  listEnrollTokensByServerId,
  listSamplesByServerId,
  listServers,
  loadAgentDb,
  loadAgentLiveDb,
} from "./db";
import { AgentTaggedError, DeviceAccessPayloadSchema } from "./schemas";
import type { EnrollResponse } from "./schemas";
import type { TServerDo } from "@/db/types";

const ENROLL_TTL_MS = 30 * 60 * 1000;
const ACCESS_TTL_SEC = 60 * 60;

export type MintedEnroll = {
  server: TServerDo;
  /** Raw one-time token — show once */
  enrollToken: string;
  expiresAt: string;
};

export const createServerWithEnrollToken = async (name: string): Promise<MintedEnroll> => {
  const db = await loadAgentDb();
  try {
    const serverId = nextUlid(null);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ENROLL_TTL_MS).toISOString();
    const enrollToken = randomToken(32);
    const tokenHash = await sha256Hex(enrollToken);

    await db.actions.upsertServer({
      id: serverId,
      name,
      status: "pending",
    }).isPersisted.promise;

    await db.actions.upsertRuntimeConfig({
      serverId,
      backgroundEnabled: true,
      autoUpdate: true,
      collectorsJson: defaultCollectorsJson(),
    }).isPersisted.promise;

    await db.actions.upsertEnrollToken({
      serverId,
      tokenHash,
      expiresAt,
    }).isPersisted.promise;

    const server = await findServerById(db, serverId);
    if (!server?.id) throw new AgentTaggedError({ _tag: "ServerMissingAfterCreate" });

    return { server, enrollToken, expiresAt };
  } finally {
    db.close();
  }
};

export const listFleetServers = async (): Promise<Array<TServerDo>> => {
  const db = await loadAgentDb();
  try {
    return await listServers(db);
  } finally {
    db.close();
  }
};

/** Hard-delete server row and related agent control-plane rows. */
export const revokeServer = async (serverId: string): Promise<void> => {
  const [db, adb] = await Promise.all([loadAgentDb(), loadAgentLiveDb()]);
  try {
    const server = await findServerById(db, serverId);
    if (!server?.id) throw new AgentTaggedError({ _tag: "ServerNotFound" });

    const enrollTokens = await listEnrollTokensByServerId(db, serverId);
    const enrollIds = enrollTokens.map((t) => t.id).filter((id): id is string => Boolean(id));
    if (enrollIds.length > 0) {
      await db.actions.deleteEnrollToken(enrollIds).isPersisted.promise;
    }

    const samples = await listSamplesByServerId(adb, serverId);
    const sampleIds = samples.map((s) => s.id).filter((id): id is string => Boolean(id));
    if (sampleIds.length > 0) {
      await adb.actions.deleteSample(sampleIds).isPersisted.promise;
    }

    await db.actions.deleteRuntimeConfig(serverId).isPersisted.promise;
    await db.actions.deleteDeviceCred(serverId).isPersisted.promise;
    await db.actions.deleteServer(server.id).isPersisted.promise;
  } finally {
    db.close();
    adb.close();
  }
};

export const enrollWithToken = async (
  rawToken: string,
  controlUrl: string,
): Promise<EnrollResponse> => {
  const db = await loadAgentDb();
  try {
    const tokenHash = await sha256Hex(rawToken);
    const row = await findEnrollTokenByHash(db, tokenHash);
    if (!row?.id) throw new AgentTaggedError({ _tag: "InvalidEnrollToken" });
    if (row.usedAt) throw new AgentTaggedError({ _tag: "EnrollTokenUsed" });
    if (Date.parse(row.expiresAt) <= Date.now()) {
      throw new AgentTaggedError({ _tag: "EnrollTokenExpired" });
    }

    const server = await findServerById(db, row.serverId);
    if (!server?.id) throw new AgentTaggedError({ _tag: "ServerNotFound" });
    if (server.status === "revoked") {
      throw new AgentTaggedError({ _tag: "ServerRevoked" });
    }

    const deviceId = nextUlid(null);
    const deviceSecret = randomToken(32);
    const secretHash = await sha256Hex(deviceSecret);
    const now = new Date().toISOString();

    await db.actions.upsertDeviceCred({
      serverId: server.id,
      deviceId,
      secretHash,
    }).isPersisted.promise;

    await db.actions.upsertServer({
      id: server.id,
      name: server.name,
      deviceId,
      status: "offline",
      lastSeenAt: server.lastSeenAt,
      agentVersion: server.agentVersion,
      createdAt: server.createdAt,
    }).isPersisted.promise;

    await db.actions.upsertEnrollToken({
      id: row.id,
      serverId: row.serverId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      usedAt: now,
      createdAt: row.createdAt,
    }).isPersisted.promise;

    await db.actions.upsertRuntimeConfig({
      serverId: server.id,
      backgroundEnabled: true,
      autoUpdate: true,
      collectorsJson: defaultCollectorsJson(),
    }).isPersisted.promise;

    return {
      deviceId,
      deviceSecret,
      controlUrl: controlUrl.replace(/\/+$/, ""),
    };
  } finally {
    db.close();
  }
};

export const issueDeviceAccessToken = async (
  deviceId: string,
  deviceSecret: string,
  hmacSecret: string,
): Promise<{ accessToken: string; expiresAt: number }> => {
  const db = await loadAgentDb();
  try {
    const cred = await findDeviceCredByDeviceId(db, deviceId);
    if (!cred || cred.revokedAt) {
      throw new AgentTaggedError({ _tag: "DeviceUnknown" });
    }
    const secretHash = await sha256Hex(deviceSecret);
    if (!timingSafeEqualHex(secretHash, cred.secretHash)) {
      throw new AgentTaggedError({ _tag: "InvalidDeviceSecret" });
    }
    const exp = Math.floor(Date.now() / 1000) + ACCESS_TTL_SEC;
    const accessToken = await signHmacJson(
      { deviceId: cred.deviceId, serverId: cred.serverId, exp },
      hmacSecret,
    );
    return { accessToken, expiresAt: exp };
  } finally {
    db.close();
  }
};

export const verifyDeviceAccessToken = async (
  token: string,
  hmacSecret: string,
): Promise<{ deviceId: string; serverId: string }> => {
  const payload = await verifyHmacJson(token, hmacSecret, (data) =>
    DeviceAccessPayloadSchema.safeParse(data),
  );
  if (!payload) throw new AgentTaggedError({ _tag: "InvalidAccessToken" });
  return { deviceId: payload.deviceId, serverId: payload.serverId };
};
