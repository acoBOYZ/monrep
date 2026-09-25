import { createServerFn } from "@tanstack/react-start";
import { clearSessionCookie, readSession, toPublicSession } from "./cookies";
import { getAuthEnv } from "./env";
import { ok } from "./result";
import { RequireCapabilityInputSchema, authErrorMessage } from "./schemas";
import { hasCapability } from "@/db/schemas";

export { loginPasswordFn } from "./password/login";
export { totpEnrollConfirmFn, totpEnrollStartFn } from "./totp/enroll";
export { totpVerifyFn } from "./totp/verify";
export { passkeyLoginOptionsFn, passkeyLoginVerifyFn } from "./passkey/login";
export { passkeyRegisterOptionsFn, passkeyRegisterVerifyFn } from "./passkey/register";
export { passkeyStatusFn } from "./passkey/status";

export const getPublicAuthConfig = createServerFn({ method: "GET" }).handler(() => {
  const { TURNSTILE_SITE_KEY, WEBAUTHN_RP_ID, ADMIN_EMAIL } = getAuthEnv();
  return {
    turnstileSiteKey: TURNSTILE_SITE_KEY,
    webauthnRpId: WEBAUTHN_RP_ID ?? null,
    adminEmailHint: ADMIN_EMAIL,
  };
});

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const session = await readSession();
  return session ? toPublicSession(session) : null;
});

export const requireSession = createServerFn({ method: "GET" }).handler(async () => {
  const session = await readSession();
  if (!session) throw new Error(authErrorMessage({ _tag: "Unauthorized" }));
  return toPublicSession(session);
});

export const requireCapability = createServerFn({ method: "POST" })
  .validator(RequireCapabilityInputSchema)
  .handler(async ({ data }) => {
    const session = await readSession();
    if (!session) throw new Error(authErrorMessage({ _tag: "Unauthorized" }));
    if (!hasCapability(session.capabilities, data.capability)) {
      throw new Error(authErrorMessage({ _tag: "Forbidden", capability: data.capability }));
    }
    return toPublicSession(session);
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(() => {
  clearSessionCookie();
  return ok();
});
