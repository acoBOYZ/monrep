import type { AuthError } from "./schemas";

export const ok = () => ({ ok: true as const });

export const err = (error: AuthError) => ({ ok: false as const, error });
