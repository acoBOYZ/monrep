import { createServerFn } from "@tanstack/react-start";
import { issueAdminSession } from "../cookies";
import { clearPendingCookie, readPendingCookie } from "../pending/cookie";
import { err, ok } from "../result";
import { decryptSecret, encryptSecret } from "./crypto";
import { buildOtpauthUri, generateTotpSecret, verifyTotpCode } from "./otp";
import { TotpEnrollConfirmInputSchema } from "./schemas";
import { findTotpByUserId, upsertTotpSecret } from "./store";

/** Start TOTP enroll — returns otpauth URI + secret for QR (pending required). */
export const totpEnrollStartFn = createServerFn({ method: "POST" }).handler(async () => {
  const pending = await readPendingCookie();
  if (!pending || pending.step !== "enroll_totp" || !pending.userId) {
    return err({ _tag: "PendingExpired" });
  }

  const existing = await findTotpByUserId(pending.userId);
  if (existing?.enabledAt) {
    return err({ _tag: "TotpAlreadyEnabled" });
  }

  const secret = generateTotpSecret();
  const secretEnc = await encryptSecret(secret);
  await upsertTotpSecret({ userId: pending.userId, secretEnc });

  const otpauth = buildOtpauthUri({ email: pending.email, secret });
  return ok({ otpauth, secret });
});

export const totpEnrollConfirmFn = createServerFn({ method: "POST" })
  .validator(TotpEnrollConfirmInputSchema)
  .handler(async ({ data }) => {
    const pending = await readPendingCookie();
    if (!pending || pending.step !== "enroll_totp" || !pending.userId) {
      return err({ _tag: "PendingExpired" });
    }

    const row = await findTotpByUserId(pending.userId);
    if (!row?.secretEnc) {
      return err({ _tag: "TotpNotStarted" });
    }

    const secret = await decryptSecret(row.secretEnc);
    if (!verifyTotpCode(secret, data.code)) {
      return err({ _tag: "InvalidTotp" });
    }

    const enabledAt = new Date().toISOString();
    await upsertTotpSecret({ userId: pending.userId, secretEnc: row.secretEnc, enabledAt });
    clearPendingCookie();
    const session = await issueAdminSession(pending.email);
    return ok({ session });
  });
