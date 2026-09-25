import { z } from "zod";
import { CapabilitySchema, RoleSchema } from "@/db/schemas";

export const DEFAULT_AUTH_REDIRECT = "/servers" as const;

export const AuthEnvSchema = z.object({
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(16),
  TURNSTILE_SITE_KEY: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  WEBAUTHN_RP_ID: z.string().min(1).optional(),
  WEBAUTHN_ORIGIN: z.url().optional(),
  /**
   * AES key material for TOTP secretEnc. Falls back to SESSION_SECRET if unset.
   * Never rotate after enroll — ciphertext becomes undecryptable (must wipe totp + re-enroll).
   */
  AUTH_ENC_KEY: z.string().min(16).optional(),
  /** HMAC for pending cookie (falls back to SESSION_SECRET). */
  AUTH_PENDING_SECRET: z.string().min(16).optional(),
  /** HMAC for WebAuthn challenge cookie (falls back to SESSION_SECRET). */
  AUTH_CHALLENGE_SECRET: z.string().min(16).optional(),
  /** Cookie names — override with `__Host-…` in prod HTTPS. */
  AUTH_SESSION_COOKIE: z.string().min(1).default("monrep_session"),
  AUTH_PENDING_COOKIE: z.string().min(1).default("monrep_auth_pending"),
  AUTH_CHALLENGE_COOKIE: z.string().min(1).default("monrep_webauthn_challenge"),
  /** Force Secure flag: "true" | "false"; default = request is https. */
  AUTH_COOKIE_SECURE: z.enum(["true", "false"]).optional(),
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
  z.object({ _tag: z.literal("TurnstileFailed") }),
  z.object({ _tag: z.literal("PendingExpired") }),
  z.object({ _tag: z.literal("InvalidTotp") }),
  z.object({ _tag: z.literal("TotpUpsertRequiresUserId") }),
  z.object({ _tag: z.literal("TotpNotStarted") }),
  z.object({ _tag: z.literal("TotpAlreadyEnabled") }),
  z.object({ _tag: z.literal("NoPasskey") }),
  z.object({ _tag: z.literal("PasskeyFailed") }),
  z.object({ _tag: z.literal("MissingId"), message: z.string().optional() }),
]);
export type AuthError = z.infer<typeof AuthErrorSchema>;

export const authErrorMessage = (error: AuthError): string => {
  switch (error._tag) {
    case "InvalidCredentials":
      return "Invalid email or password";
    case "Unauthorized":
      return "Not authenticated";
    case "Forbidden":
      return `Missing capability: ${error.capability}`;
    case "TurnstileFailed":
      return "Bot check failed. Try again.";
    case "PendingExpired":
      return "Sign-in expired. Start again.";
    case "InvalidTotp":
      return "Invalid authenticator code";
    case "TotpUpsertRequiresUserId":
      return "TOTP upsert requires userId";
    case "TotpNotStarted":
      return "Authenticator setup required";
    case "TotpAlreadyEnabled":
      return "Authenticator already enabled";
    case "NoPasskey":
      return "No passkey registered";
    case "PasskeyFailed":
      return "Passkey verification failed";
    case "MissingId":
      return `auth.user missing id ${error.message ? `: ${error.message}` : ""}`;

    default:
      return "Unknown error";
  }
};
