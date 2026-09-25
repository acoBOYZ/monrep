import { readCookieValue, signHmacJson, verifyHmacJson } from "@monrep/utils";
import { SessionPayloadSchema } from "./schemas";
import type { SessionPayload } from "./schemas";

export type { SessionPayload };

export { SESSION_MAX_AGE_SEC } from "./cookieConfig";

export const signSession = async (payload: SessionPayload, secret: string): Promise<string> =>
  signHmacJson(payload, secret);

export const verifySession = async (
  token: string | undefined,
  secret: string,
): Promise<SessionPayload | null> =>
  verifyHmacJson(token, secret, (json) => SessionPayloadSchema.safeParse(json));

export const readSessionCookieFromHeader = (
  cookieHeader: string | null,
  cookieName: string,
): string | undefined => readCookieValue(cookieHeader, cookieName);

/** Verify session from a raw Request (Worker stream gate). */
export const resolveSessionFromRequest = async (
  request: Request,
  sessionSecret: string,
  cookieName: string,
): Promise<SessionPayload | null> => {
  const token = readSessionCookieFromHeader(request.headers.get("cookie"), cookieName);
  return verifySession(token, sessionSecret);
};
