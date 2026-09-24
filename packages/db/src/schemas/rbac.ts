import { z } from "zod";

export const CAPABILITIES = ["admin", "playground", "audit:read"] as const;

export const CapabilitySchema = z.enum(CAPABILITIES);
export const RoleSchema = z.enum(["admin", "operator", "viewer"]);

export type Capability = z.infer<typeof CapabilitySchema>;
export type Role = z.infer<typeof RoleSchema>;

export const ROLE_CAPABILITIES = {
  admin: ["admin", "playground", "audit:read"],
  operator: ["playground", "audit:read"],
  viewer: ["audit:read"],
} as const satisfies Record<Role, ReadonlyArray<Capability>>;

export const hasCapability = (
  capabilities: ReadonlyArray<string>,
  capability: Capability,
): boolean => capabilities.includes(capability);
