import { z } from "zod";
import { createDoModule, doTable } from "./create-do-module.gen";

export default createDoModule("audit")({
  streamLive: "long-poll",
  streamPersist: false,
  collections: {
    security: doTable({
      type: "security",
      primaryKey: "id",
      indexes: ["createdAt"],
      schema: {
        id: z.string(),
        email: z.string(),
        ip: z.string(),
        success: z.boolean(),
        userAgent: z.string().optional(),
        createdAt: z.string().optional(),
      },
      onInsert: ({ ctx }) => ({
        id: ctx.ulid,
        createdAt: ctx.now,
      }),
    }),
  },
});
