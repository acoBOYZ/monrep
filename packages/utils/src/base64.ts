/**
 * Encodes bytes to standard Base64 using browser-safe APIs.
 */
export function bytesToBase64(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Encodes a UTF-8 string to Base64 using browser-safe APIs.
 * Returns undefined on error.
 * @param str The string to encode.
 */
export function toBase64(str: string): string | undefined {
  try {
    return bytesToBase64(new TextEncoder().encode(str));
  } catch {
    return undefined;
  }
}

/**
 * Decodes a Base64 string to a UTF-8 string using browser-safe APIs.
 * Returns undefined on error.
 * @param b64 The Base64-encoded string.
 */
export function fromBase64(b64: string): string | undefined {
  try {
    const bytes = base64ToBytes(b64);
    return new TextDecoder().decode(bytes);
  } catch {
    return undefined;
  }
}

export function base64ToBytes(b64: string) {
  const binary = atob(b64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** RFC 4648 §5 Base64url (no padding). */
export function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  return bytesToBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

/** Decode Base64url to bytes. */
export function fromBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return base64ToBytes(padded + pad);
}
