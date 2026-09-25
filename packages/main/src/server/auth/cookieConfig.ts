import { getRequest } from "@tanstack/react-start/server";
import { getAuthEnv } from "./env";
import type { AuthEnv } from "./schemas";

export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7d
export const PENDING_MAX_AGE_SEC = 60 * 5;
export const CHALLENGE_MAX_AGE_SEC = 60 * 5;

export const authCookieNames = (env: AuthEnv = getAuthEnv()) => ({
  session: env.AUTH_SESSION_COOKIE,
  pending: env.AUTH_PENDING_COOKIE,
  challenge: env.AUTH_CHALLENGE_COOKIE,
});

export const authCookieSecrets = (env: AuthEnv = getAuthEnv()) => ({
  session: env.SESSION_SECRET,
  pending: env.AUTH_PENDING_SECRET ?? env.SESSION_SECRET,
  challenge: env.AUTH_CHALLENGE_SECRET ?? env.SESSION_SECRET,
});

/** Secure cookies: forced by AUTH_COOKIE_SECURE, __Host- name, or https request. */
export const authCookieSecure = (cookieName: string, requestUrl?: string): boolean => {
  if (cookieName.startsWith("__Host-")) return true;
  const env = getAuthEnv();
  if (env.AUTH_COOKIE_SECURE === "true") return true;
  if (env.AUTH_COOKIE_SECURE === "false") return false;
  const url = requestUrl ?? getRequest().url;
  return new URL(url).protocol === "https:";
};

export const authCookieSetOpts = (cookieName: string, maxAge: number) => ({
  httpOnly: true as const,
  path: "/" as const,
  sameSite: "lax" as const,
  maxAge,
  secure: authCookieSecure(cookieName),
});
