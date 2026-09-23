/** Public Worker mount for Durable Streams. Worker routing imports this constant. */
export const STREAMS_PATH_PREFIX = "/_streams";

export function isStreamsPath(pathname: string): boolean {
  return pathname === STREAMS_PATH_PREFIX || pathname.startsWith(`${STREAMS_PATH_PREFIX}/`);
}

/** Absolute stream URL for a module (browser or server). */
export function streamModuleUrl(baseUrl: string, moduleId: string): string {
  const origin = baseUrl.replace(/\/$/, "");
  return `${origin}${STREAMS_PATH_PREFIX}/${moduleId}`;
}

export function browserStreamUrl(moduleId: string): string {
  return streamModuleUrl(window.location.origin, moduleId);
}
