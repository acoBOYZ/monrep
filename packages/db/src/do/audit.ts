import { z } from "zod";
import { createDoModule, doTable } from "./create-do-module.gen";

export default createDoModule("audit")({
  collections: {
    audit: doTable({
      type: "audit",
      primaryKey: "id",
      schema: {
        id: z.string(),
      },
    }),
  },
});
