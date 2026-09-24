import { env } from "cloudflare:workers";
import { AuthEnvSchema } from "./schemas";
import type { AuthEnv } from "./schemas";

/** Auth secrets from Worker bindings / `.dev.vars`. */
export const getAuthEnv = (): AuthEnv => AuthEnvSchema.parse(env);
