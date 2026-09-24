import { z } from "zod";
import { createDoModule, doTable } from "./create-do-module.gen";

export default createDoModule("testm")({
  streamLive: "sse",
  streamPersist: false,
  collections: {
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
  },
});
