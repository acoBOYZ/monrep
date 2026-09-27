import {
  AgentTaggedError,
  DeviceTokenRequestSchema,
  EnrollRequestSchema,
  agentErrorMessage,
  agentErrorStatus,
} from "@/server/agent/schemas";
import {
  enrollWithToken,
  issueDeviceAccessToken,
  verifyDeviceAccessToken,
} from "@/server/agent/service";
import { getAgentSessionStub } from "@/server/agent/sessionDo";
import { AuthEnvSchema } from "@/server/auth/schemas";

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const controlUrlFromRequest = (request: Request): string => {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
};

const agentErrorResponse = (error: AgentTaggedError["error"]): Response =>
  json({ error: error._tag, message: agentErrorMessage(error) }, agentErrorStatus(error));

/** Handle `/api/agent/*` device routes (no admin session cookie). */
export const handleAgentApi = async (request: Request, env: Env): Promise<Response | undefined> => {
  const { pathname } = new URL(request.url);
  if (!pathname.startsWith("/api/agent/")) return undefined;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST, OPTIONS, GET",
        "access-control-allow-headers": "content-type, authorization",
      },
    });
  }

  try {
    if (pathname === "/api/agent/ws" && request.method === "GET") {
      return await upgradeAgentWs(request, env);
    }

    if (pathname === "/api/agent/enroll" && request.method === "POST") {
      const body = EnrollRequestSchema.safeParse(await request.json());
      if (!body.success)
        return json({ error: "invalid_body", message: "Invalid enroll body" }, 400);
      const result = await enrollWithToken(body.data.token, controlUrlFromRequest(request));
      return json(result);
    }

    if (pathname === "/api/agent/token" && request.method === "POST") {
      const body = DeviceTokenRequestSchema.safeParse(await request.json());
      if (!body.success) return json({ error: "invalid_body", message: "Invalid token body" }, 400);
      const parsedEnv = AuthEnvSchema.pick({ SESSION_SECRET: true }).safeParse(env);
      if (!parsedEnv.success) {
        return json({ error: "misconfigured", message: "Server misconfigured" }, 500);
      }
      const result = await issueDeviceAccessToken(
        body.data.deviceId,
        body.data.deviceSecret,
        parsedEnv.data.SESSION_SECRET,
      );
      return json(result);
    }

    return json({ error: "not_found", message: "Unknown agent route" }, 404);
  } catch (err) {
    if (err instanceof AgentTaggedError) {
      return agentErrorResponse(err.error);
    }
    console.error("[agent-api]", err);
    return json({ error: "internal", message: "Internal error" }, 500);
  }
};

const upgradeAgentWs = async (request: Request, env: Env): Promise<Response> => {
  if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
    return json({ error: "expected_websocket", message: "WebSocket upgrade required" }, 426);
  }
  const auth = request.headers.get("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token) {
    return agentErrorResponse({ _tag: "InvalidAccessToken" });
  }
  const parsedEnv = AuthEnvSchema.pick({ SESSION_SECRET: true }).safeParse(env);
  if (!parsedEnv.success) {
    return json({ error: "misconfigured", message: "Server misconfigured" }, 500);
  }
  const access = await verifyDeviceAccessToken(token, parsedEnv.data.SESSION_SECRET);
  const stub = getAgentSessionStub(env, access.deviceId);
  return stub.fetch(request);
};
