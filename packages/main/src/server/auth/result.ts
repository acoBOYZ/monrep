import type { AuthError } from "./schemas";

export function ok(): { ok: true };
export function ok<T extends object>(data: T): { ok: true } & T;
export function ok<T extends object>(data?: T) {
  return data ? ({ ok: true as const, ...data } as { ok: true } & T) : { ok: true as const };
}

export const err = (error: AuthError) => ({ ok: false as const, error });
