import { createDoModule, doTable } from "@monrep/db/module";
import { z } from "zod";

/**
 * High-churn heartbeat last-seen only. Epoched so the stream DO rotates daily
 * without wiping the immortal `agent` catalog (servers, creds, config).
 */
export default createDoModule("agent_presence")({
  streamEpoch: "utc-day",
  streamLive: "long-poll",
  streamPersist: false,
  collections: {
    presence: doTable({
      primaryKey: "serverId",
      indexes: ["serverId"],
      schema: {
        serverId: z.string(),
        lastSeenAt: z.string(),
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
