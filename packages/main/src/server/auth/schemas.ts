import { CapabilitySchema, RoleSchema } from "@monrep/db/schemas";
import { z } from "zod";

export const DEFAULT_AUTH_REDIRECT = "/servers" as const;

export const AuthEnvSchema = z.object({
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(16),
});
export type AuthEnv = z.infer<typeof AuthEnvSchema>;

export const SessionPayloadSchema = z.object({
  email: z.email(),
  role: RoleSchema,
  capabilities: z.array(CapabilitySchema),
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

export const RequireCapabilityInputSchema = z.object({
  capability: CapabilitySchema,
});
export type RequireCapabilityInput = z.infer<typeof RequireCapabilityInputSchema>;

export const LoginAttemptSchema = z.object({
  email: z.string().min(1),
  ip: z.string().min(1),
  success: z.boolean(),
  userAgent: z.string().optional(),
});
export type LoginAttemptInput = z.infer<typeof LoginAttemptSchema>;

export const UpsertAuthUserSchema = z.object({
  email: z.email(),
  role: RoleSchema,
  capabilities: z.array(CapabilitySchema),
  name: z.string().optional(),
});
export type UpsertAuthUserInput = z.infer<typeof UpsertAuthUserSchema>;

export const AuthErrorSchema = z.discriminatedUnion("_tag", [
  z.object({ _tag: z.literal("InvalidCredentials") }),
  z.object({ _tag: z.literal("Unauthorized") }),
  z.object({ _tag: z.literal("Forbidden"), capability: CapabilitySchema }),
]);
export type AuthError = z.infer<typeof AuthErrorSchema>;

export const LoginResultSchema = z.union([
  z.object({ ok: z.literal(true) }),
  z.object({ ok: z.literal(false), error: AuthErrorSchema }),
]);
export type LoginResult = z.infer<typeof LoginResultSchema>;

export const LogoutResultSchema = z.object({ ok: z.literal(true) });
export type LogoutResult = z.infer<typeof LogoutResultSchema>;

export const authErrorMessage = (error: AuthError): string => {
  switch (error._tag) {
    case "InvalidCredentials":
      return "Invalid email or password";
    case "Unauthorized":
      return "Not authenticated";
    case "Forbidden":
      return `Missing capability: ${error.capability}`;
  }
};
