/**
 * Encodes a UTF-8 string to Base64 using browser-safe APIs.
 * Returns undefined on error.
 * @param str The string to encode.
 */
export function toBase64(str: string): string | undefined {
  try {
    const encoded = new TextEncoder().encode(str);
    const binary = Array.from(encoded).reduce((acc, byte) => acc + String.fromCharCode(byte), "");
    return btoa(binary);
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
