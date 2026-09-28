import { createDoModule, doTable } from "@monrep/db/module";
import { z } from "zod";

export const SampleKindSchema = z.enum(["monitor", "error", "overload", "health", "other"]);

export default createDoModule("agent_live")({
  streamLive: "sse",
  streamPersist: false,
  streamEpoch: "utc-day",
  collections: {
    sample: doTable({
      primaryKey: "id",
      indexes: ["serverId", "kind", "at", "runId"],
      schema: {
        id: z.string().optional(),
        serverId: z.string(),
        kind: SampleKindSchema,
        at: z.string(),
        runId: z.string().optional(),
        /** JSON payload from collector / health / run event */
        payloadJson: z.string(),
        createdAt: z.string().optional(),
      },
      onInsert: ({ ctx }) => ({
        id: ctx.ulid,
        createdAt: ctx.now,
      }),
    }),
  },
});
