import { z } from "zod";

export const PasswordLoginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  turnstileToken: z.string().min(1),
});
export type PasswordLoginInput = z.infer<typeof PasswordLoginInputSchema>;
