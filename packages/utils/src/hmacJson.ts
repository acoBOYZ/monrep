import { fromBase64Url, toBase64Url } from "./base64";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export type HmacSafeParse<T> = (json: unknown) => { success: true; data: T } | { success: false };

const importHmacKey = async (secret: string): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

/** Sign a JSON payload as `body.sig` (base64url + HMAC-SHA-256). */
export const signHmacJson = async (payload: object, secret: string): Promise<string> => {
  const body = toBase64Url(textEncoder.encode(JSON.stringify(payload)));
  const key = await importHmacKey(secret);
  const sig = toBase64Url(await crypto.subtle.sign("HMAC", key, textEncoder.encode(body)));
  return `${body}.${sig}`;
};

/** Verify `body.sig`, parse JSON, run safeParse, reject expired `exp` (unix seconds). */
export const verifyHmacJson = async <T extends { exp: number }>(
  token: string | undefined,
  secret: string,
  safeParse: HmacSafeParse<T>,
): Promise<T | null> => {
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
    const json: unknown = JSON.parse(textDecoder.decode(fromBase64Url(body)));
    const parsed = safeParse(json);
    if (!parsed.success) return null;
    if (parsed.data.exp * 1000 <= Date.now()) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

/** Read a single cookie value from a Cookie header. */
export const readCookieValue = (cookieHeader: string | null, name: string): string | undefined => {
  if (!cookieHeader) return;
  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) return rest.join("=");
  }
};
