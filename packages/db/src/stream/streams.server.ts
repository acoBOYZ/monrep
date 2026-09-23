import { createStreamsHandler } from "@durable-streams/server-cloudflare";

/** Public Worker routes: optional AUTH_TOKEN bearer auth (open when unset). */
export const publicStreamsHandler = createStreamsHandler();
