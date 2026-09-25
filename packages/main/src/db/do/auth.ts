import { createDoModule, doTable } from "@monrep/db/module";
import { z } from "zod";
import { CapabilitySchema, RoleSchema } from "../schemas";

export default createDoModule("auth")({
  streamLive: "long-poll",
  streamPersist: false,
  collections: {
    user: doTable({
      primaryKey: "id",
      indexes: ["email"],
      schema: {
        id: z.string().optional(),
        email: z.string(),
        name: z.string().optional(),
        role: RoleSchema,
        capabilities: z.array(CapabilitySchema),
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
    totp: doTable({
      primaryKey: "userId",
      indexes: ["userId"],
      schema: {
        userId: z.string(),
        secretEnc: z.string(),
        enabledAt: z.string().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
      },
      onInsert: ({ ctx }) => ({
        createdAt: ctx.now,
        updatedAt: ctx.now,
      }),
      onUpdate: ({ ctx }) => ({
        updatedAt: ctx.now,
      }),
    }),
    passkey: doTable({
      primaryKey: "id",
      indexes: ["userId", "credentialId"],
      schema: {
        id: z.string(),
        userId: z.string(),
        credentialId: z.string(),
        publicKey: z.string(),
        counter: z.number(),
        transports: z.array(z.string()).optional(),
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
  },
});
