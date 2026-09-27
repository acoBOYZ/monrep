import type { TStreamEpoch } from "../../module";

/** Grace after the next UTC bucket so live SSE ends near roll while cold catch-up can finish. */
export const EPOCH_EXPIRE_GRACE_MS = 60_000;

/**
 * Suffix for the current UTC bucket.
 * - `utc-day` → `YYYY-MM-DD`
 * - `utc-hour` → `YYYY-MM-DDTHH`
 */
export function getEpochLabel(epoch: TStreamEpoch, now: Date): string {
  switch (epoch) {
    case "utc-day":
      return now.toISOString().slice(0, 10);
    case "utc-hour":
      return now.toISOString().slice(0, 13);
    default: {
      const unexpected: never = epoch;
      throw new Error(`Unknown stream epoch: ${JSON.stringify(unexpected)}`);
    }
  }
}

/** Clock for the previous UTC bucket (GC target). */
export function getPreviousEpoch(epoch: TStreamEpoch, now: Date): Date {
  switch (epoch) {
    case "utc-day": {
      const prior = new Date(now.getTime());
      prior.setUTCDate(prior.getUTCDate() - 1);
      return prior;
    }
    case "utc-hour": {
      const prior = new Date(now.getTime());
      prior.setUTCHours(prior.getUTCHours() - 1);
      return prior;
    }
    default: {
      const unexpected: never = epoch;
      throw new Error(`Unknown stream epoch: ${JSON.stringify(unexpected)}`);
    }
  }
}

/** Instant of the next UTC bucket boundary (exclusive of `now`). */
export function nextEpochBoundary(epoch: TStreamEpoch, now: Date): Date {
  switch (epoch) {
    case "utc-hour": {
      const next = new Date(now.getTime());
      next.setUTCMinutes(0, 0, 0);
      next.setUTCHours(next.getUTCHours() + 1);
      return next;
    }
    case "utc-day": {
      const next = new Date(now.getTime());
      next.setUTCHours(0, 0, 0, 0);
      next.setUTCDate(next.getUTCDate() + 1);
      return next;
    }
    default: {
      const unexpected: never = epoch;
      throw new Error(`Unknown stream epoch: ${JSON.stringify(unexpected)}`);
    }
  }
}

/**
 * `Stream-Expires-At` for the current bucket: next UTC boundary + short grace.
 * Forces live SSE to end near epoch roll so clients reconnect to the new physical stream.
 */
export function getExpiresAtByEpoch(epoch: TStreamEpoch, now: Date): Date {
  return new Date(nextEpochBoundary(epoch, now).getTime() + EPOCH_EXPIRE_GRACE_MS);
}
