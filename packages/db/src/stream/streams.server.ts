import { createStreamsHandler } from "@durable-streams/server-cloudflare";
import { DO_MODULE_EPOCH } from "../do";
import {
  STREAM_EPOCH_HEADER,
  getEpochLabel,
  getExpiresAtByEpoch,
  getPreviousEpoch,
  physicalStreamPath,
  streamModuleIdFromPath,
} from "./paths";
import type { DefaultAuthEnv, StreamsHandlerOptions } from "@durable-streams/server-cloudflare";
import type { TDoModuleId } from "../types";

type WaitUntilCtx = {
  waitUntil: (promise: Promise<unknown>) => void;
};

const isKnownModule = (moduleId: string): moduleId is TDoModuleId =>
  Object.hasOwn(DO_MODULE_EPOCH, moduleId);

/**
 * Worker routes for `/_streams/*`.
 * Epoch modules: rewrite to physical clock bucket, cold-GET DELETE prev,
 * PUT `Stream-Expires-At`, stamp `x-stream-epoch`.
 */
export const createPublicStreamsHandler = <E extends DefaultAuthEnv = DefaultAuthEnv>(
  options?: StreamsHandlerOptions<E>,
) => {
  const base = createStreamsHandler(options);

  return async (request: Request, env: E, ctx?: WaitUntilCtx): Promise<Response> => {
    if (request.method === "OPTIONS") return base(request, env);

    const url = new URL(request.url);
    const moduleId = streamModuleIdFromPath(url.pathname);
    if (!moduleId || !isKnownModule(moduleId)) {
      return base(request, env);
    }

    const now = new Date();
    const epoch = DO_MODULE_EPOCH[moduleId];
    const physical = physicalStreamPath(moduleId, now);
    const epochLabel = epoch ? getEpochLabel(epoch, now) : null;

    url.pathname = physical;

    let headers = request.headers;
    if (request.method === "PUT" && epoch) {
      headers = new Headers(request.headers);
      if (!headers.has("Stream-Expires-At") && !headers.has("Stream-TTL")) {
        headers.set("Stream-Expires-At", getExpiresAtByEpoch(epoch, now).toISOString());
      }
    }

    const method = request.method.toUpperCase();
    if ((method === "GET" || method === "HEAD") && epoch && ctx) {
      const offset = new URL(request.url).searchParams.get("offset");
      if (offset === null || offset === "-1") {
        const prevPath = physicalStreamPath(moduleId, getPreviousEpoch(epoch, now));
        if (prevPath !== physical) {
          ctx.waitUntil(
            base(
              new Request(new URL(prevPath, request.url), {
                method: "DELETE",
                headers: request.headers,
              }),
              env,
            ),
          );
        }
      }
    }

    const hasBody = method !== "GET" && method !== "HEAD";
    const forwarded = new Request(url, {
      method: request.method,
      headers,
      body: hasBody ? request.body : null,
      ...(hasBody ? { duplex: "half" as const } : {}),
    });

    const response = await base(forwarded, env);
    if (!epochLabel) return response;

    const out = new Headers(response.headers);
    out.set(STREAM_EPOCH_HEADER, epochLabel);
    const expose = out.get("access-control-expose-headers");
    out.set(
      "access-control-expose-headers",
      expose ? `${expose}, ${STREAM_EPOCH_HEADER}` : STREAM_EPOCH_HEADER,
    );
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: out,
    });
  };
};
