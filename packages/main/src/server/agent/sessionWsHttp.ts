/** Browser → session DO WebSocket bridge (admin session cookie). */

import { findServerById, loadAgentDb } from "@/server/agent/db";
import { getAgentSessionStub } from "@/server/agent/sessionDo";
import { AuthEnvSchema } from "@/server/auth/schemas";
import { resolveSessionFromRequest } from "@/server/auth/session";

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

/** Handle `/api/agent/session-ws` (session cookie required). */
export const handleSessionWsApi = async (
  request: Request,
  env: Env,
  pathname: string,
): Promise<Response> => {
  if (pathname === "/api/agent/session-ws" && request.method === "GET") {
    return upgradeBrowserSessionWs(request, env);
  }

  return json({ error: "not_found", message: "Unknown session-ws route" }, 404);
};

const upgradeBrowserSessionWs = async (request: Request, env: Env): Promise<Response> => {
  if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
    return json({ error: "expected_websocket", message: "WebSocket upgrade required" }, 426);
  }

  const parsedEnv = AuthEnvSchema.pick({
    SESSION_SECRET: true,
    AUTH_SESSION_COOKIE: true,
  }).safeParse(env);
  if (!parsedEnv.success) {
    return json({ error: "misconfigured", message: "Server misconfigured" }, 500);
  }

  const session = await resolveSessionFromRequest(
    request,
    parsedEnv.data.SESSION_SECRET,
    parsedEnv.data.AUTH_SESSION_COOKIE,
  );
  if (!session) {
    return json({ error: "unauthorized", message: "Not signed in" }, 401);
  }

  const serverId = new URL(request.url).searchParams.get("serverId");
  if (!serverId) {
    return json({ error: "invalid_body", message: "serverId required" }, 400);
  }

  const db = await loadAgentDb();
  try {
    const server = await findServerById(db, serverId);
    if (!server?.id) {
      return json({ error: "not_found", message: "Server not found" }, 404);
    }
    if (!server.deviceId) {
      return json({ error: "offline", message: "Device not enrolled" }, 409);
    }
    const stub = getAgentSessionStub(env, server.deviceId);
    const doUrl = new URL("https://agent-session/browser-ws");
    doUrl.searchParams.set("serverId", serverId);
    return stub.fetch(
      new Request(doUrl.toString(), {
        method: "GET",
        headers: request.headers,
      }),
    );
  } finally {
    db.close();
  }
};
