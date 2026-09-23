const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_SAFE_BIGINT = BigInt(Number.MIN_SAFE_INTEGER);

export type IntLike = number | bigint | string | null | undefined;

/**
 * Convert any integer-like value to BigInt safely.
 * Returns 0n for invalid input.
 */
export function toBigIntSafe(v: IntLike): bigint {
  if (typeof v === "bigint") return v;

  if (typeof v === "number") {
    if (!Number.isFinite(v)) return 0n;
    return BigInt(Math.trunc(v));
  }

  if (typeof v === "string") {
    try {
      return BigInt(v);
    } catch {
      return 0n;
    }
  }

  return 0n;
}

/**
 * Convert any integer-like value to number safely.
 * Clamps to Number.MAX_SAFE_INTEGER if overflow happens.
 */
export function toNumberSafe(v: IntLike): number {
  if (typeof v === "number") {
    return Number.isFinite(v) ? v : 0;
  }

  if (typeof v === "bigint") {
    if (v > MAX_SAFE_BIGINT) return Number.MAX_SAFE_INTEGER;
    if (v < MIN_SAFE_BIGINT) return Number.MIN_SAFE_INTEGER;
    return Number(v);
  }

  if (typeof v === "string") {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;

    try {
      const bi = BigInt(v);
      if (bi > MAX_SAFE_BIGINT) return Number.MAX_SAFE_INTEGER;
      if (bi < MIN_SAFE_BIGINT) return Number.MIN_SAFE_INTEGER;
      return Number(bi);
    } catch {
      return n;
    }
  }

  return 0;
}
