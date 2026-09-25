import { fromBase64Url, toBase64Url } from "@monrep/utils";
import { SessionPayloadSchema } from "./schemas";
import type { SessionPayload } from "./schemas";

export const SESSION_COOKIE = "{{name}}_session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type { SessionPayload };

const textEncoder = new TextEncoder();

const importHmacKey = async (secret: string): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

export const signSession = async (payload: SessionPayload, secret: string): Promise<string> => {
  const body = toBase64Url(textEncoder.encode(JSON.stringify(payload)));
  const key = await importHmacKey(secret);
  const sig = toBase64Url(await crypto.subtle.sign("HMAC", key, textEncoder.encode(body)));
  return `${body}.${sig}`;
};

export const verifySession = async (
  token: string | undefined,
  secret: string,
): Promise<SessionPayload | null> => {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const key = await importHmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(sig) as BufferSource,
    textEncoder.encode(body),
  );
  if (!valid) return null;

  try {
    const json: unknown = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
    const parsed = SessionPayloadSchema.safeParse(json);
    if (!parsed.success) return null;
    if (parsed.data.exp * 1000 <= Date.now()) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

export const readSessionCookieFromHeader = (cookieHeader: string | null): string | undefined => {
  if (!cookieHeader) return;
  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === SESSION_COOKIE) return rest.join("=");
  }
};

export const resolveSessionFromRequest = async (
  request: Request,
  sessionSecret: string,
): Promise<SessionPayload | null> => {
  const token = readSessionCookieFromHeader(request.headers.get("cookie"));
  return verifySession(token, sessionSecret);
};
