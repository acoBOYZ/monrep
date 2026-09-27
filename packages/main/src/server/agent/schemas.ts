import { z } from "zod";

export const CollectorSpecSchema = z.object({
  enabled: z.boolean(),
  intervalSec: z.number().int().positive(),
  argv: z.array(z.string()),
});

export const CollectorsMapSchema = z.record(z.string(), CollectorSpecSchema);

export type CollectorsMap = z.infer<typeof CollectorsMapSchema>;

export const CreateServerInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const EnrollRequestSchema = z.object({
  token: z.string().min(16),
});

export const DeviceTokenRequestSchema = z.object({
  deviceId: z.string().min(1),
  deviceSecret: z.string().min(16),
});

export const EnrollResponseSchema = z.object({
  deviceId: z.string(),
  deviceSecret: z.string(),
  controlUrl: z.string().url(),
});

export type EnrollResponse = z.infer<typeof EnrollResponseSchema>;

/** Access token body for Phase 2 WSS (HMAC-signed). */
export const DeviceAccessPayloadSchema = z.object({
  deviceId: z.string(),
  serverId: z.string(),
  exp: z.number().int(),
});

export const AgentErrorSchema = z.discriminatedUnion("_tag", [
  z.object({ _tag: z.literal("ServerNotFound") }),
  z.object({ _tag: z.literal("ServerMissingAfterCreate") }),
  z.object({ _tag: z.literal("ServerRevoked") }),
  z.object({ _tag: z.literal("InvalidEnrollToken") }),
  z.object({ _tag: z.literal("EnrollTokenUsed") }),
  z.object({ _tag: z.literal("EnrollTokenExpired") }),
  z.object({ _tag: z.literal("DeviceUnknown") }),
  z.object({ _tag: z.literal("InvalidDeviceSecret") }),
  z.object({ _tag: z.literal("InvalidAccessToken") }),
  z.object({ _tag: z.literal("SessionNotConnected") }),
  z.object({ _tag: z.literal("MissingDevice") }),
]);
export type AgentError = z.infer<typeof AgentErrorSchema>;

export const agentErrorMessage = (error: AgentError): string => {
  switch (error._tag) {
    case "ServerNotFound":
      return "Server not found";
    case "ServerMissingAfterCreate":
      return "Server missing after create";
    case "ServerRevoked":
      return "Server revoked";
    case "InvalidEnrollToken":
      return "Invalid enroll token";
    case "EnrollTokenUsed":
      return "Enroll token already used";
    case "EnrollTokenExpired":
      return "Enroll token expired";
    case "DeviceUnknown":
      return "Unknown or revoked device";
    case "InvalidDeviceSecret":
      return "Invalid device secret";
    case "InvalidAccessToken":
      return "Invalid or expired access token";
    case "SessionNotConnected":
      return "Agent session not connected";
    case "MissingDevice":
      return "Server has no enrolled device";
    default:
      return "Unknown error";
  }
};

/** Carries typed `_tag` payload; message from agentErrorMessage for logs / HTTP. */
export class AgentTaggedError extends Error {
  readonly error: AgentError;
  constructor(error: AgentError) {
    super(agentErrorMessage(error));
    this.name = "AgentTaggedError";
    this.error = error;
  }
}

/** HTTP status for agent device API responses. */
export const agentErrorStatus = (error: AgentError): number => {
  switch (error._tag) {
    case "ServerNotFound":
    case "MissingDevice":
      return 404;
    case "ServerRevoked":
      return 403;
    case "SessionNotConnected":
      return 409;
    case "ServerMissingAfterCreate":
      return 500;
    default:
      return 401;
  }
};
