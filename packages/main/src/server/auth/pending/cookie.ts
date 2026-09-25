import { signHmacJson, verifyHmacJson } from "@monrep/utils";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import {
  PENDING_MAX_AGE_SEC,
  authCookieNames,
  authCookieSecrets,
  authCookieSetOpts,
} from "../cookieConfig";
import { getAuthEnv } from "../env";
import { PendingPayloadSchema } from "./types";
import type { PendingPayload } from "./types";

export const setPendingCookie = async (payload: Omit<PendingPayload, "exp">): Promise<void> => {
  const env = getAuthEnv();
  const { pending: name } = authCookieNames(env);
  const { pending: secret } = authCookieSecrets(env);
  const exp = Math.floor(Date.now() / 1000) + PENDING_MAX_AGE_SEC;
  const token = await signHmacJson({ ...payload, exp }, secret);
  setCookie(name, token, authCookieSetOpts(name, PENDING_MAX_AGE_SEC));
};

export const readPendingCookie = async (): Promise<PendingPayload | null> => {
  const env = getAuthEnv();
  const { pending: name } = authCookieNames(env);
  const { pending: secret } = authCookieSecrets(env);
  return verifyHmacJson(getCookie(name), secret, (json) => PendingPayloadSchema.safeParse(json));
};

export const clearPendingCookie = (): void => {
  const { pending: name } = authCookieNames();
  deleteCookie(name, { path: "/" });
};
