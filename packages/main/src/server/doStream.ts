/** Shared Durable Stream open for server-side DO module writes. */

import { getDoRegistry } from "@monrep/db";
import { ensureStream } from "@monrep/db/stream/client";
import {
  getExpiresAtByEpoch,
  physicalStreamPath,
  streamModuleIdFromPath,
  streamPath,
} from "@monrep/db/stream/common";
import { env } from "cloudflare:workers";
import type { DurableStream } from "@durable-streams/client";
import type { TDoModuleId } from "@/db/types";

/**
 * Opens a module stream for Worker-side writes.
 * Uses the logical URL (`/_streams/<moduleId>`) like the browser client, but resolves
 * the Durable Object via the physical epoch path — same rewrite as createPublicStreamsHandler.
 * Epoch modules must not write to the logical DO name.
 */
export const openServerStream = async (moduleId: TDoModuleId): Promise<DurableStream> => {
  const pathname = streamPath(moduleId);
  const url = `https://streams.internal${pathname}`;
  return ensureStream({
    url,
    contentType: "application/json",
    fetch: ((input, init) => {
      const request = new Request(input, init);
      const reqUrl = new URL(request.url);
      const mid = streamModuleIdFromPath(reqUrl.pathname) ?? moduleId;
      const now = new Date();
      const physical = physicalStreamPath(mid, now);
      reqUrl.pathname = physical;

      let headers = request.headers;
      const epoch = getDoRegistry().epoch[mid];
      const method = request.method.toUpperCase();
      if (method === "PUT" && epoch) {
        headers = new Headers(request.headers);
        if (!headers.has("Stream-Expires-At") && !headers.has("Stream-TTL")) {
          headers.set("Stream-Expires-At", getExpiresAtByEpoch(epoch, now).toISOString());
        }
      }

      const stub = env.STREAMS.get(env.STREAMS.idFromName(physical));
      const hasBody = method !== "GET" && method !== "HEAD";
      return stub.fetch(
        new Request(reqUrl, {
          method: request.method,
          headers,
          body: hasBody ? request.body : null,
          ...(hasBody ? { duplex: "half" as const } : {}),
        }),
      );
    }) as typeof fetch,
  });
};
