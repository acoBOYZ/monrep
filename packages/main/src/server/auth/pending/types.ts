import { z } from "zod";

export const PendingStepSchema = z.enum(["totp", "enroll_totp"]);
export type PendingStep = z.infer<typeof PendingStepSchema>;

export const PendingMethodSchema = z.enum(["password", "passkey"]);
export type PendingMethod = z.infer<typeof PendingMethodSchema>;

export const PendingPayloadSchema = z.object({
  email: z.email(),
  userId: z.string().min(1),
  step: PendingStepSchema,
  method: PendingMethodSchema,
  exp: z.number().int().positive(),
});
export type PendingPayload = z.infer<typeof PendingPayloadSchema>;

export const ChallengePayloadSchema = z.object({
  attemptId: z.string().min(1),
  challenge: z.string().min(1),
  flow: z.enum(["login", "register"]),
  userId: z.string().min(1),
  email: z.email(),
  exp: z.number().int().positive(),
});
export type ChallengePayload = z.infer<typeof ChallengePayloadSchema>;
