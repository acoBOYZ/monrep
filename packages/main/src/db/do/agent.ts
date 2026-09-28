import { createDoModule, doTable } from "@monrep/db/module";
import { z } from "zod";

export const ServerStatusSchema = z.enum(["pending", "online", "offline", "revoked"]);

export default createDoModule("agent")({
  streamLive: "long-poll",
  streamPersist: false,
  collections: {
    server: doTable({
      primaryKey: "id",
      indexes: ["status", "deviceId", "createdAt"],
      schema: {
        id: z.string().optional(),
        name: z.string(),
        deviceId: z.string().optional(),
        status: ServerStatusSchema,
        lastSeenAt: z.string().optional(),
        agentVersion: z.string().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
      },
      onInsert: ({ ctx }) => ({
        id: ctx.ulid,
        createdAt: ctx.now,
        updatedAt: ctx.now,
      }),
      onUpdate: ({ ctx }) => ({
        updatedAt: ctx.now,
      }),
    }),
    enroll_token: doTable({
      primaryKey: "id",
      indexes: ["serverId", "expiresAt", "tokenHash"],
      schema: {
        id: z.string().optional(),
        serverId: z.string(),
        tokenHash: z.string(),
        expiresAt: z.string(),
        usedAt: z.string().optional(),
        createdAt: z.string().optional(),
      },
      onInsert: ({ ctx }) => ({
        id: ctx.ulid,
        createdAt: ctx.now,
      }),
    }),
    device_cred: doTable({
      primaryKey: "serverId",
      indexes: ["serverId", "deviceId"],
      schema: {
        serverId: z.string(),
        deviceId: z.string(),
        secretHash: z.string(),
        createdAt: z.string().optional(),
        revokedAt: z.string().optional(),
      },
      onInsert: ({ ctx }) => ({
        createdAt: ctx.now,
      }),
    }),
    runtime_config: doTable({
      primaryKey: "serverId",
      indexes: ["serverId"],
      schema: {
        serverId: z.string(),
        backgroundEnabled: z.boolean(),
        autoUpdate: z.boolean().optional(),
        /** Serialized CollectorsMapSchema JSON */
        collectorsJson: z.string(),
        updatedAt: z.string().optional(),
      },
      onInsert: ({ ctx }) => ({
        updatedAt: ctx.now,
      }),
      onUpdate: ({ ctx }) => ({
        updatedAt: ctx.now,
      }),
    }),
  },
});
