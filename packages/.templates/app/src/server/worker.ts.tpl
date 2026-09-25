import { StreamObject } from "@durable-streams/server-cloudflare";
import { isStreamsPath } from "@monrep/db/stream/paths";
import { createPublicStreamsHandler } from "@monrep/db/stream/streams.server";
import startHandler from "@tanstack/react-start/server-entry";
import { AuthEnvSchema } from "./auth/schemas";
import { resolveSessionFromRequest } from "./auth/session";
import { bindDoApp } from "@/db/host";

bindDoApp();

export { StreamObject };

type StreamsEnv = Env & {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
};

const streamsHandler = createPublicStreamsHandler<StreamsEnv>({
  auth: async (request, env) => {
    const parsed = AuthEnvSchema.pick({ SESSION_SECRET: true }).safeParse(env);
    if (!parsed.success) {
      return new Response("Server misconfigured", { status: 500 });
    }
    const { SESSION_SECRET: secret } = parsed.data;
    const session = await resolveSessionFromRequest(request, secret);
    if (session) return undefined;
    return new Response("Unauthorized", { status: 401 });
  },
});

export default {
  async fetch(request: Request, env: StreamsEnv, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (isStreamsPath(pathname)) {
      return streamsHandler(request, env, ctx);
    }
    return startHandler.fetch(request);
  },
};
