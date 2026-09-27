import { createDoModule, doTable } from "@monrep/db/module";
import { z } from "zod";

export const TermLineKindSchema = z.enum(["in", "out", "meta"]);

/** Showcase DO — same collections shape as main `testm` (presence, chat, typing, terminal lines). */
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
    typing: doTable({
      primaryKey: "userId",
      indexes: ["userId"],
      schema: {
        userId: z.ulid(),
        name: z.string(),
        draft: z.string(),
        updatedAt: z.string().optional(),
      },
      onInsert: ({ ctx }) => ({
        updatedAt: ctx.now,
      }),
      onUpdate: ({ ctx }) => ({
        updatedAt: ctx.now,
      }),
    }),
    line: doTable({
      primaryKey: "id",
      indexes: ["createdAt", "id", "tabId"],
      schema: {
        id: z.ulid().optional(),
        tabId: z.ulid(),
        userId: z.ulid(),
        name: z.string(),
        kind: TermLineKindSchema,
        text: z.string(),
        createdAt: z.string().optional(),
      },
      onInsert: ({ ctx }) => ({
        id: ctx.ulid,
        createdAt: ctx.now,
      }),
    }),
  },
});
