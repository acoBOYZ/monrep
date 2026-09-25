import { fromBase64Url, toBase64Url } from "@monrep/utils";
import { getAuthEnv } from "../env";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const getEncKeyMaterial = (): string => {
  const env = getAuthEnv();
  // AUTH_ENC_KEY must stay stable for the life of stored totp.secretEnc rows.
  return env.AUTH_ENC_KEY ?? env.SESSION_SECRET;
};

const importAesKey = async (): Promise<CryptoKey> => {
  const material = textEncoder.encode(getEncKeyMaterial());
  const hash = await crypto.subtle.digest("SHA-256", material);
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
};

/** AES-GCM enc → base64url(iv || ciphertext). */
export const encryptSecret = async (plaintext: string): Promise<string> => {
  const key = await importAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(plaintext),
  );
  const out = new Uint8Array(iv.length + cipher.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), iv.length);
  return toBase64Url(out);
};

export const decryptSecret = async (secretEnc: string): Promise<string> => {
  const key = await importAesKey();
  const raw = fromBase64Url(secretEnc);
  const iv = raw.slice(0, 12);
  const data = raw.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return textDecoder.decode(plain);
};
