import { readCookieValue, signHmacJson, verifyHmacJson } from "@monrep/utils";
import { SessionPayloadSchema } from "./schemas";
import type { SessionPayload } from "./schemas";

export const SESSION_COOKIE = "{{name}}_session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type { SessionPayload };

export const signSession = async (payload: SessionPayload, secret: string): Promise<string> =>
  signHmacJson(payload, secret);

export const verifySession = async (
  token: string | undefined,
  secret: string,
): Promise<SessionPayload | null> =>
  verifyHmacJson(token, secret, (json) => SessionPayloadSchema.safeParse(json));

export const readSessionCookieFromHeader = (cookieHeader: string | null): string | undefined =>
  readCookieValue(cookieHeader, SESSION_COOKIE);

export const resolveSessionFromRequest = async (
  request: Request,
  sessionSecret: string,
): Promise<SessionPayload | null> => {
  const token = readSessionCookieFromHeader(request.headers.get("cookie"));
  return verifySession(token, sessionSecret);
};
