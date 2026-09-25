import { signHmacJson, verifyHmacJson } from "@monrep/utils";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import {
  CHALLENGE_MAX_AGE_SEC,
  authCookieNames,
  authCookieSecrets,
  authCookieSetOpts,
} from "../cookieConfig";
import { getAuthEnv } from "../env";
import { ChallengePayloadSchema } from "./types";
import type { ChallengePayload } from "./types";

export const setChallengeCookie = async (payload: Omit<ChallengePayload, "exp">): Promise<void> => {
  const env = getAuthEnv();
  const { challenge: name } = authCookieNames(env);
  const { challenge: secret } = authCookieSecrets(env);
  const exp = Math.floor(Date.now() / 1000) + CHALLENGE_MAX_AGE_SEC;
  const token = await signHmacJson({ ...payload, exp }, secret);
  setCookie(name, token, authCookieSetOpts(name, CHALLENGE_MAX_AGE_SEC));
};

export const readChallengeCookie = async (): Promise<ChallengePayload | null> => {
  const env = getAuthEnv();
  const { challenge: name } = authCookieNames(env);
  const { challenge: secret } = authCookieSecrets(env);
  return verifyHmacJson(getCookie(name), secret, (json) => ChallengePayloadSchema.safeParse(json));
};

export const clearChallengeCookie = (): void => {
  const { challenge: name } = authCookieNames();
  deleteCookie(name, { path: "/" });
};
