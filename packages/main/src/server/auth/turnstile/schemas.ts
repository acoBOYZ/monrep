import { z } from "zod";

export const TurnstileTokenSchema = z.object({
  turnstileToken: z.string().min(1),
});

export type TurnstileVerifyResult = { ok: true } | { ok: false; codes: Array<string> };
