import { env } from "cloudflare:workers";
import { AuthEnvSchema } from "./schemas";
import type { AuthEnv } from "./schemas";

export const getAuthEnv = (): AuthEnv => AuthEnvSchema.parse(env);
