import { z } from "zod";
import { createDoModule, doTable } from "./create-do-module.gen";

export default createDoModule("session")({
  streamLive: "sse",
  streamPersist: false,
  collections: {
    users: doTable({
      type: "users",
      primaryKey: "id",
      schema: {
        id: z.string(),
        name: z.string(),
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
    presence: doTable({
      type: "presence",
      primaryKey: "userId",
      indexes: ["userId"],
      schema: {
        userId: z.ulid(),
        name: z.string().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
      },
      onInsert: ({ ctx }) => ({
        userId: ctx.ulid,
        createdAt: ctx.now,
        updatedAt: ctx.now,
      }),
      onUpdate: ({ ctx }) => ({
        updatedAt: ctx.now,
      }),
    }),
    typing: doTable({
      type: "typing",
      primaryKey: "userId",
      schema: {
        userId: z.string(),
      },
    }),
  },
});
