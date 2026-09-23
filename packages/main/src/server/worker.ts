import { StreamObject } from "@durable-streams/server-cloudflare";
import { isStreamsPath } from "@monrep/db/stream/paths";
import { publicStreamsHandler } from "@monrep/db/stream/streams.server";
import startHandler from "@tanstack/react-start/server-entry";

/*
 * Worker entry (minimal — Vite/wrangler introspect exports):
 * - Browser live (long-poll by default, or SSE when the shape says so) → public `/_streams/...`
 *   via publicStreamsHandler (unbuffered DO response).
 * - Everything else → TanStack Start.
 *
 * Writes go through the generated StreamDB actions on this same route.
 */

export { StreamObject };

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (isStreamsPath(pathname)) {
      return publicStreamsHandler(request, env);
    }
    return startHandler.fetch(request);
  },
};
