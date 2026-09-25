import { tryCatch } from "@monrep/utils";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { clientIp } from "../cookies";
import { ensureAdminUser } from "../db";
import { getAuthEnv } from "../env";
import { setPendingCookie } from "../pending/cookie";
import { err, ok } from "../result";
import { recordLoginAttempt } from "../streamWrites";
import { findTotpByUserId } from "../totp/store";
import { verifyTurnstileToken } from "../turnstile/verify";
import { PasswordLoginInputSchema } from "./schemas";

export const loginPasswordFn = createServerFn({ method: "POST" })
  .validator(PasswordLoginInputSchema)
  .handler(async ({ data }) => {
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = getAuthEnv();
    const email = data.email.trim().toLowerCase();
    const ip = clientIp();
    const userAgent = getRequestHeader("user-agent") ?? undefined;

    const turnstile = await verifyTurnstileToken(data.turnstileToken, ip);
    if (!turnstile.ok) {
      await tryCatch(recordLoginAttempt({ email, ip, success: false, userAgent }));
      return err({ _tag: "TurnstileFailed" });
    }

    const success = email === ADMIN_EMAIL.trim().toLowerCase() && data.password === ADMIN_PASSWORD;

    await tryCatch(recordLoginAttempt({ email, ip, success, userAgent }));

    if (!success) {
      return err({ _tag: "InvalidCredentials" });
    }

    const user = await ensureAdminUser(email);
    const totp = await findTotpByUserId(user.id);
    const step = totp?.enabledAt ? ("totp" as const) : ("enroll_totp" as const);
    await setPendingCookie({ email, userId: user.id, step, method: "password" });
    return ok({ step });
  });
