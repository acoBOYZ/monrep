import { z } from "zod";

export const AuthEnvSchema = z.object({
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(16),
});
export type AuthEnv = z.infer<typeof AuthEnvSchema>;

export const DEFAULT_AUTH_REDIRECT = "/playground/streams" as const;

export const SessionPayloadSchema = z.object({
  email: z.email(),
  exp: z.number().int().positive(),
});
export type SessionPayload = z.infer<typeof SessionPayloadSchema>;

export const PublicSessionSchema = SessionPayloadSchema.omit({ exp: true });
export type PublicSession = z.infer<typeof PublicSessionSchema>;

export const LoginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  redirect: z.string().optional(),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const AuthErrorSchema = z.discriminatedUnion("_tag", [
  z.object({ _tag: z.literal("InvalidCredentials") }),
  z.object({ _tag: z.literal("Unauthorized") }),
]);
export type AuthError = z.infer<typeof AuthErrorSchema>;

export const authErrorMessage = (error: AuthError): string => {
  switch (error._tag) {
    case "InvalidCredentials":
      return "Invalid email or password";
    case "Unauthorized":
      return "Not authenticated";
  }
};
