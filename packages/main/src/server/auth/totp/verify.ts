import { createServerFn } from "@tanstack/react-start";
import { issueAdminSession } from "../cookies";
import { clearPendingCookie, readPendingCookie } from "../pending/cookie";
import { err, ok } from "../result";
import { decryptSecret } from "./crypto";
import { verifyTotpCode } from "./otp";
import { TotpVerifyInputSchema } from "./schemas";
import { findTotpByUserId } from "./store";

/** Pending + TOTP code → full session (only mint path besides enroll confirm). */
export const totpVerifyFn = createServerFn({ method: "POST" })
  .validator(TotpVerifyInputSchema)
  .handler(async ({ data }) => {
    const pending = await readPendingCookie();
    if (!pending || pending.step !== "totp" || !pending.userId) {
      return err({ _tag: "PendingExpired" });
    }

    const row = await findTotpByUserId(pending.userId);
    if (!row?.secretEnc || !row.enabledAt) {
      return err({ _tag: "TotpNotStarted" });
    }

    const secret = await decryptSecret(row.secretEnc);
    if (!verifyTotpCode(secret, data.code)) {
      return err({ _tag: "InvalidTotp" });
    }

    clearPendingCookie();
    const session = await issueAdminSession(pending.email);
    return ok({ session });
  });
