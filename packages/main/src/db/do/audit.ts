import { createDoModule, doTable } from "@monrep/db/module";
import { z } from "zod";

export default createDoModule("audit")({
  streamLive: "long-poll",
  streamPersist: false,
  collections: {
    security: doTable({
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
