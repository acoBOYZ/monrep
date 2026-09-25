import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { analyzer } from "vite-bundle-analyzer";
import type { ServerOptions as HttpsServerOptions } from "node:https";

const DOMAIN = "https://app.monrep.com";

const CERT_DIR = resolve(import.meta.dirname, "../../certs");
const VITE_KEY = resolve(CERT_DIR, "vite-dev.key");
const VITE_CERT = resolve(CERT_DIR, "vite-dev.crt");

function resolveDevHttps(): HttpsServerOptions | undefined {
  if (!existsSync(VITE_KEY) || !existsSync(VITE_CERT)) {
    console.warn("[vite] missing certs/vite-dev.{key,crt} — HTTP only. Run: bun run setup:dev");
    return undefined;
  }
  return {
    key: readFileSync(VITE_KEY),
    cert: readFileSync(VITE_CERT),
  };
}

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";
  const isDebug = mode === "debug" || mode === "development";
  const isCompiler = process.env.REACT_COMPILER === "true";
  const useOxc = !isProduction && isCompiler;
  // TODO: Remove it when oxc native react compiler is stable.
  const useBabel = isProduction && isCompiler;
  const https = !isProduction ? resolveDevHttps() : undefined;

  return {
    server: {
      port: 5274,
      ...(https ? { https } : {}),
    },
    plugins: [
      cloudflare({
        viteEnvironment: { name: "ssr" },
        inspectorPort: false,
      }),
      tailwindcss(),
      tanstackStart({
        sitemap: {
          enabled: true,
          host: DOMAIN,
        },
        pages: [
          {
            path: "/",
            sitemap: {
              changefreq: "monthly",
              priority: 1,
              alternateRefs: [
                { hreflang: "en", href: DOMAIN },
                { hreflang: "tr", href: DOMAIN },
                { hreflang: "x-default", href: DOMAIN },
              ],
            },
          },
        ],
      }),
      react({ compiler: useOxc }),
      useBabel && babel({ presets: [reactCompilerPreset()] }),
      isDebug && analyzer({ analyzerMode: "static", openAnalyzer: true }),
    ],
    resolve: {
      tsconfigPaths: true,
      alias: {
        tslib: "tslib/tslib.es6.js",
        "@": resolve(import.meta.dirname, "./src"),
        "@monrep/db": resolve(import.meta.dirname, "../db/src"),
        "@monrep/hooks": resolve(import.meta.dirname, "../hooks/src"),
        "@monrep/ui": resolve(import.meta.dirname, "../ui/src"),
        "@monrep/utils": resolve(import.meta.dirname, "../utils/src"),
      },
    },
  };
});
