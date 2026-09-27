import "zod/compile";
import "temporal-polyfill/global";
import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { CANONICAL_HOST, FRAME_ANCESTORS } from "./brand.gen";

/** Host app origins allowed to iframe this agent surface. */
const FRAME_ANCESTORS_CSP = FRAME_ANCESTORS.join(" ");

const SECURITY_HEADERS = [
  ["Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  [
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)",
  ],
  ["Content-Security-Policy", `frame-ancestors ${FRAME_ANCESTORS_CSP}`],
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

export { CANONICAL_HOST };
