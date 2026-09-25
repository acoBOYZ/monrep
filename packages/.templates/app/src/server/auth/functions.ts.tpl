import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, getRequest, setCookie } from "@tanstack/react-start/server";
import { getAuthEnv } from "./env";
import { err, ok } from "./result";
import { LoginInputSchema, PublicSessionSchema, authErrorMessage } from "./schemas";
import { SESSION_COOKIE, SESSION_MAX_AGE_SEC, signSession, verifySession } from "./session";
import type { PublicSession, SessionPayload } from "./schemas";

const toPublicSession = (session: SessionPayload): PublicSession =>
  PublicSessionSchema.parse({ email: session.email });

const readSession = async (): Promise<SessionPayload | null> => {
  const { SESSION_SECRET } = getAuthEnv();
  return verifySession(getCookie(SESSION_COOKIE), SESSION_SECRET);
};

const setSessionCookie = async (session: SessionPayload): Promise<void> => {
  const { SESSION_SECRET } = getAuthEnv();
  const token = await signSession(session, SESSION_SECRET);
  const secure = new URL(getRequest().url).protocol === "https:";
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SEC,
    secure,
  });
};

const clearSessionCookie = (): void => {
  deleteCookie(SESSION_COOKIE, { path: "/" });
};

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const session = await readSession();
  return session ? toPublicSession(session) : null;
});

export const requireSession = createServerFn({ method: "GET" }).handler(async () => {
  const session = await readSession();
  if (!session) throw new Error(authErrorMessage({ _tag: "Unauthorized" }));
  return toPublicSession(session);
});

export const loginFn = createServerFn({ method: "POST" })
  .validator(LoginInputSchema)
  .handler(async ({ data }) => {
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = getAuthEnv();
    const email = data.email.trim().toLowerCase();
    const success = email === ADMIN_EMAIL.trim().toLowerCase() && data.password === ADMIN_PASSWORD;
    if (!success) return err({ _tag: "InvalidCredentials" });

    const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
    await setSessionCookie({ email, exp });
    return ok();
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(() => {
  clearSessionCookie();
  return ok();
});
