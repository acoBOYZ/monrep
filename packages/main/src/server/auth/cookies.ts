import {
  deleteCookie,
  getCookie,
  getRequestHeader,
  getRequestIP,
  setCookie,
} from "@tanstack/react-start/server";
import {
  SESSION_MAX_AGE_SEC,
  authCookieNames,
  authCookieSecrets,
  authCookieSetOpts,
} from "./cookieConfig";
import { getAuthEnv } from "./env";
import { PublicSessionSchema } from "./schemas";
import { signSession, verifySession } from "./session";
import type { PublicSession, SessionPayload } from "./schemas";
import { ROLE_CAPABILITIES } from "@/db/schemas";

export const toPublicSession = (session: SessionPayload): PublicSession =>
  PublicSessionSchema.parse({
    email: session.email,
    role: session.role,
    capabilities: session.capabilities,
  });

export const readSession = async (): Promise<SessionPayload | null> => {
  const env = getAuthEnv();
  const { session: name } = authCookieNames(env);
  const { session: secret } = authCookieSecrets(env);
  return verifySession(getCookie(name), secret);
};

export const clientIp = (): string => {
  const fromCf = getRequestIP({ xForwardedFor: true });
  if (fromCf) return fromCf;
  return getRequestHeader("cf-connecting-ip") ?? "unknown";
};

export const setSessionCookie = async (session: SessionPayload): Promise<void> => {
  const env = getAuthEnv();
  const { session: name } = authCookieNames(env);
  const { session: secret } = authCookieSecrets(env);
  const token = await signSession(session, secret);
  setCookie(name, token, authCookieSetOpts(name, SESSION_MAX_AGE_SEC));
};

export const clearSessionCookie = (): void => {
  const { session: name } = authCookieNames();
  deleteCookie(name, { path: "/" });
};

/** Mint full admin session after TOTP success. */
export const issueAdminSession = async (email: string): Promise<PublicSession> => {
  const role = "admin" as const;
  const capabilities = [...ROLE_CAPABILITIES[role]];
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const payload: SessionPayload = { email, role, capabilities, exp };
  await setSessionCookie(payload);
  return toPublicSession(payload);
};
