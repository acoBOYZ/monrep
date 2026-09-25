import { createDoModule, doTable } from "@monrep/db/module";
import { z } from "zod";

export default createDoModule("demo")({
  streamLive: "sse",
  streamPersist: false,
  streamEpoch: "utc-hour",
  collections: {
    presence: doTable({
      primaryKey: "userId",
      indexes: ["userId"],
      schema: {
        userId: z.ulid().optional(),
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
    message: doTable({
      primaryKey: "id",
      indexes: ["createdAt", "id"],
      schema: {
        id: z.ulid(),
        userId: z.ulid(),
        name: z.string(),
        body: z.string(),
        createdAt: z.string(),
      },
      onInsert: ({ ctx }) => ({
        id: ctx.ulid,
        createdAt: ctx.now,
      }),
    }),
  },
});
