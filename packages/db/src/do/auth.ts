import { z } from "zod";
import { CapabilitySchema, RoleSchema } from "../schemas";
import { createDoModule, doTable } from "./create-do-module.gen";

export default createDoModule("auth")({
  streamLive: "long-poll",
  streamPersist: false,
  collections: {
    user: doTable({
      type: "user",
      primaryKey: "id",
      indexes: ["email"],
      schema: {
        id: z.string(),
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
  },
});
