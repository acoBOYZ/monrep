import { z } from "zod";

export const TotpEnrollConfirmInputSchema = z.object({
  code: z.string().min(6).max(8),
});

export const TotpVerifyInputSchema = z.object({
  code: z.string().min(6).max(8),
});
