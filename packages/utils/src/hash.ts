/** SHA-256 hex digests, random tokens, timing-safe hex compare. */

import { toBase64Url } from "./base64";

const textEncoder = new TextEncoder();

const toHex = (bytes: ArrayBuffer): string =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

export const sha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(value));
  return toHex(digest);
};

export const randomToken = (bytes = 32): string => {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return toBase64Url(buf);
};

export const timingSafeEqualHex = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
};
