import { createStreamsHandler } from "@durable-streams/server-cloudflare";
import type { DefaultAuthEnv, StreamsHandlerOptions } from "@durable-streams/server-cloudflare";

/** Worker routes for `/_streams/*`. Pass `auth` to gate browser/server access. */
export const createPublicStreamsHandler = <E extends DefaultAuthEnv = DefaultAuthEnv>(
  options?: StreamsHandlerOptions<E>,
) => createStreamsHandler(options);
