import { z } from "zod";

export const PasskeyLoginOptionsInputSchema = z.object({
  email: z.email().optional(),
});

export const PasskeyLoginVerifyInputSchema = z.object({
  email: z.email(),
  response: z.unknown(),
});

export const PasskeyRegisterVerifyInputSchema = z.object({
  response: z.unknown(),
});
