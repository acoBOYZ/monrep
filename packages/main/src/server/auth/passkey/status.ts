import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ensureAdminUser } from "../db";
import { getAuthEnv } from "../env";
import { err, ok } from "../result";
import { adminHasPasskeys } from "./store";

const PasskeyStatusInputSchema = z.object({
  email: z.email().optional(),
});

export const passkeyStatusFn = createServerFn({ method: "POST" })
  .validator(PasskeyStatusInputSchema)
  .handler(async ({ data }) => {
    const { ADMIN_EMAIL } = getAuthEnv();
    const email = (data.email ?? ADMIN_EMAIL).trim().toLowerCase();
    if (email !== ADMIN_EMAIL.trim().toLowerCase()) {
      return ok({ hasPasskeys: false });
    }
    try {
      const user = await ensureAdminUser(email);
      const hasPasskeys = await adminHasPasskeys(user.id);
      return ok({ hasPasskeys });
    } catch {
      return err({ _tag: "Unauthorized" });
    }
  });
