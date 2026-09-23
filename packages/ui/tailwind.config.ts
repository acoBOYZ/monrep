import { resolve } from "node:path";
import type { Config } from "tailwindcss";

const config = {
  content: [
    /**
     * REQUIRED: local @monrep/ui sources
     */
    resolve(__dirname, "src/**/*.{ts,tsx}"),

    /**
     * Workspace packages that consume @monrep/ui
     */
    resolve(__dirname, "../main/src/**/*.{ts,tsx}"),
  ],
  theme: {},
  plugins: [],
} satisfies Config;

export default config;
