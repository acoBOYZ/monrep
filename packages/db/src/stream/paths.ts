/** Public Worker mount for Durable Streams. Worker routing imports this constant. */
export const STREAMS_PATH_PREFIX = "/_streams";

export function isStreamsPath(pathname: string): boolean {
  return pathname === STREAMS_PATH_PREFIX || pathname.startsWith(`${STREAMS_PATH_PREFIX}/`);
}

export function browserStreamUrl(moduleId: string): string {
  return `${window.location.origin}${STREAMS_PATH_PREFIX}/${moduleId}`;
}
