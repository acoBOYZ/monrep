import { StreamObject } from "@durable-streams/server-cloudflare";
import { isStreamsPath } from "@monrep/db/stream/common";
import { createPublicStreamsHandler } from "@monrep/db/stream/server";
import startHandler from "@tanstack/react-start/server-entry";
import { handleAgentApi } from "./agent/http";
import { AuthEnvSchema } from "./auth/schemas";
import { resolveSessionFromRequest } from "./auth/session";
import { INSTALL_SH } from "./installSh";
import { bindDoApp } from "@/db/host";

bindDoApp();

/*
 * Worker entry:
 * - `GET /install.sh` → agent install script (public)
 * - `/_streams/*` → Durable Streams (session cookie)
 * - `/api/agent/*` → device enroll / token / ws (no admin cookie)
 * - Everything else → TanStack Start
 */

export { StreamObject };
export { AgentSession } from "./agent/sessionDo";

type StreamsEnv = Env & {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
};

const streamsHandler = createPublicStreamsHandler<StreamsEnv>({
  auth: async (request, env) => {
    const parsed = AuthEnvSchema.pick({
      SESSION_SECRET: true,
      AUTH_SESSION_COOKIE: true,
    }).safeParse(env);

    if (!parsed.success) {
      return new Response("Server misconfigured", { status: 500 });
    }

    const { SESSION_SECRET: secret, AUTH_SESSION_COOKIE: cookieName } = parsed.data;

    const session = await resolveSessionFromRequest(request, secret, cookieName);
    if (session) return undefined;

    return new Response("Unauthorized", { status: 401 });
  },
});

export default {
  async fetch(request: Request, env: StreamsEnv, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/install.sh" && (request.method === "GET" || request.method === "HEAD")) {
      return new Response(request.method === "HEAD" ? null : INSTALL_SH, {
        status: 200,
        headers: {
          "content-type": "text/x-shellscript; charset=utf-8",
          "cache-control": "public, max-age=300",
        },
      });
    }
    if (isStreamsPath(pathname)) {
      return streamsHandler(request, env, ctx);
    }
    const agentResponse = await handleAgentApi(request, env);
    if (agentResponse) return agentResponse;
    return startHandler.fetch(request);
  },
};
