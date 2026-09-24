import "zod/compile";
import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

const CANONICAL_HOST = "app.monrep.com";

/** Host app origins allowed to iframe this agent surface. */
const FRAME_ANCESTORS = [
  "'self'",
  "https://monrep.com",
  "https://www.monrep.com",
  "https://app.monrep.com",
  "http://localhost:5273",
  "http://127.0.0.1:5273",
  "https://localhost:5273",
  "https://127.0.0.1:5273",
].join(" ");

const SECURITY_HEADERS = [
  ["Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload"],
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  [
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)",
  ],
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

export { CANONICAL_HOST };
