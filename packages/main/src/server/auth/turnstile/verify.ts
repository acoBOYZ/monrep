import { getAuthEnv } from "../env";
import type { TurnstileVerifyResult } from "./schemas";

type SiteverifyResponse = {
  success?: boolean;
  "error-codes"?: Array<string>;
};

/** Cloudflare Turnstile siteverify. Pure — password layer wires the token. */
export const verifyTurnstileToken = async (
  token: string,
  ip: string,
): Promise<TurnstileVerifyResult> => {
  const { TURNSTILE_SECRET_KEY } = getAuthEnv();
  const body = new URLSearchParams({
    secret: TURNSTILE_SECRET_KEY,
    response: token,
    remoteip: ip,
  });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    return { ok: false, codes: [`http_${response.status}`] };
  }
  const json = (await response.json()) as SiteverifyResponse;
  if (json.success) return { ok: true };
  return { ok: false, codes: json["error-codes"] ?? ["unknown"] };
};
