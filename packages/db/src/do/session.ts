import { z } from "zod";
import { createDoModule } from "./create-do-module.gen";

export default createDoModule("session")({
  streamLive: "sse",
  streamPersist: false,
  collections: {
    users: {
      type: "users",
      primaryKey: "id",
      schema: {
        id: z.string(),
        name: z.string(),
      },
    },
    presence: {
      type: "presence",
      primaryKey: "userId",
      schema: {
        userId: z.string(),
        name: z.string().optional(),
      },
    },
    typing: {
      type: "typing",
      primaryKey: "userId",
      schema: {
        userId: z.string(),
      },
    },
  },
});
