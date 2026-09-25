import "zod/compile";
import "temporal-polyfill/global";
import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

const FRAME_ANCESTORS = ["'self'", "http://localhost:{{dev_port}}", "https://localhost:{{dev_port}}"].join(" ")

const SECURITY_HEADERS = [
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Content-Security-Policy", `frame-ancestors ${FRAME_ANCESTORS}`],
] as const;

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

const securityHeadersMiddleware = createMiddleware().server(async ({ next }) => {
  const result = await next();
  for (const [header, value] of SECURITY_HEADERS) {
    result.response.headers.set(header, value);
  }
  return result;
});

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [csrfMiddleware, securityHeadersMiddleware],
  };
});
