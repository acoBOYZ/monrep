import { getDoRegistry } from "../registry";
import type { TStreamEpoch } from "../module";

/** Public Worker mount for Durable Streams. Worker routing imports this constant. */
export const STREAMS_PATH_PREFIX = "/_streams";

export const STREAM_EPOCH_HEADER = "x-stream-epoch";

export function isStreamsPath(pathname: string): boolean {
  return pathname === STREAMS_PATH_PREFIX || pathname.startsWith(`${STREAMS_PATH_PREFIX}/`);
}

/** Module id from `/_streams/<moduleId>/…` (first segment only). */
export function streamModuleIdFromPath(pathname: string): string | null {
  if (!pathname.startsWith(`${STREAMS_PATH_PREFIX}/`)) return null;
  const segment = pathname.slice(STREAMS_PATH_PREFIX.length + 1).split("/")[0];
  return segment && segment.length > 0 ? segment : null;
}

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

/**
 * `Stream-Expires-At` for the current bucket (+1h grace after next rotation).
 * - `utc-day` → next UTC midnight + 1h
 * - `utc-hour` → start of current hour + 2h
 */
export function getExpiresAtByEpoch(epoch: TStreamEpoch, now: Date): Date {
  switch (epoch) {
    case "utc-day": {
      const end = new Date(now.getTime());
      end.setUTCHours(0, 0, 0, 0);
      end.setUTCDate(end.getUTCDate() + 1);
      end.setUTCHours(1, 0, 0, 0);
      return end;
    }
    case "utc-hour": {
      const end = new Date(now.getTime());
      end.setUTCMinutes(0, 0, 0);
      end.setUTCHours(end.getUTCHours() + 2);
      return end;
    }
    default: {
      const unexpected: never = epoch;
      throw new Error(`Unknown stream epoch: ${JSON.stringify(unexpected)}`);
    }
  }
}

/** Logical client path. Always `/_streams/<moduleId>` (no bucket). */
export function streamPath(moduleId: string): string {
  return `${STREAMS_PATH_PREFIX}/${moduleId}`;
}

/** Physical DO name path. Appends ISO label when the module has an epoch. */
export function physicalStreamPath(moduleId: string, now = new Date()): string {
  const epoch = getDoRegistry().epoch[moduleId];
  if (!epoch) return streamPath(moduleId);
  return `${streamPath(moduleId)}/${getEpochLabel(epoch, now)}`;
}

/** Current epoch label for a module, or `null` when immortal. */
export function moduleEpochLabel(moduleId: string, now = new Date()): string | null {
  const epoch = getDoRegistry().epoch[moduleId];
  if (!epoch) return null;
  return getEpochLabel(epoch, now);
}

/** Absolute stream URL for a module (logical, browser or server). */
export function streamModuleUrl(baseUrl: string, moduleId: string): string {
  const origin = baseUrl.replace(/\/$/, "");
  return `${origin}${streamPath(moduleId)}`;
}

export function browserStreamUrl(moduleId: string): string {
  return streamModuleUrl(window.location.origin, moduleId);
}
