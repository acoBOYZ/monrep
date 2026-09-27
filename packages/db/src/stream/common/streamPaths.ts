import { getDoRegistry } from "../../registry";
import { getEpochLabel } from "./streamEpoch";

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
