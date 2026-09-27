/** Shared Durable Stream open for server-side DO module writes. */

import { ensureStream } from "@monrep/db/stream/client";
import { streamPath } from "@monrep/db/stream/common";
import { env } from "cloudflare:workers";
import type { DurableStream } from "@durable-streams/client";

export type ServerWriteModule = "audit" | "auth" | "agent";

export const openServerStream = async (moduleId: ServerWriteModule): Promise<DurableStream> => {
  const pathname = streamPath(moduleId);
  const url = `https://streams.internal${pathname}`;
  return ensureStream({
    url,
    contentType: "application/json",
    fetch: ((input, init) => {
      const request = new Request(input, init);
      const path = new URL(request.url).pathname;
      const stub = env.STREAMS.get(env.STREAMS.idFromName(path));
      return stub.fetch(request);
    }) as typeof fetch,
  });
};
