import type { AuthError } from "./schemas";

export { ok } from "@/server/result";
export const err = (error: AuthError) => ({ ok: false as const, error });
