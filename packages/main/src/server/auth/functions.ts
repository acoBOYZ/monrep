import { tryCatch } from "@monrep/utils";
import { createServerFn } from "@tanstack/react-start";
import {
  deleteCookie,
  getCookie,
  getRequest,
  getRequestHeader,
  getRequestIP,
  setCookie,
} from "@tanstack/react-start/server";
import { getAuthEnv } from "./env";
import { err, ok } from "./result";
import {
  LoginInputSchema,
  PublicSessionSchema,
  RequireCapabilityInputSchema,
  authErrorMessage,
} from "./schemas";
import { SESSION_COOKIE, SESSION_MAX_AGE_SEC, signSession, verifySession } from "./session";
import { recordLoginAttempt, upsertAuthUser } from "./streamWrites";
import type { PublicSession, SessionPayload } from "./schemas";
import { ROLE_CAPABILITIES, hasCapability } from "@/db/schemas";

const toPublicSession = (session: SessionPayload): PublicSession =>
  PublicSessionSchema.parse({
    email: session.email,
    role: session.role,
    capabilities: session.capabilities,
  });

const readSession = async (): Promise<SessionPayload | null> => {
  const { SESSION_SECRET } = getAuthEnv();
  return verifySession(getCookie(SESSION_COOKIE), SESSION_SECRET);
};

const clientIp = (): string => {
  const fromCf = getRequestIP({ xForwardedFor: true });
  if (fromCf) return fromCf;
  return getRequestHeader("cf-connecting-ip") ?? "unknown";
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

export const requireCapability = createServerFn({ method: "POST" })
  .validator(RequireCapabilityInputSchema)
  .handler(async ({ data }) => {
    const session = await readSession();
    if (!session) throw new Error(authErrorMessage({ _tag: "Unauthorized" }));
    if (!hasCapability(session.capabilities, data.capability)) {
      throw new Error(authErrorMessage({ _tag: "Forbidden", capability: data.capability }));
    }
    return toPublicSession(session);
  });

export const loginFn = createServerFn({ method: "POST" })
  .validator(LoginInputSchema)
  .handler(async ({ data }) => {
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = getAuthEnv();
    const email = data.email.trim().toLowerCase();
    const success = email === ADMIN_EMAIL.trim().toLowerCase() && data.password === ADMIN_PASSWORD;
    const ip = clientIp();
    const userAgent = getRequestHeader("user-agent") ?? undefined;

    const { error: loginAttemptError } = await tryCatch(
      recordLoginAttempt({ email, ip, success, userAgent }),
    );
    if (loginAttemptError) {
      console.error("[auth] failed to record login attempt", loginAttemptError);
    }

    if (!success) {
      return err({ _tag: "InvalidCredentials" });
    }

    const role = "admin" as const;
    const capabilities = ROLE_CAPABILITIES[role];
    const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;

    const { error: upsertError } = await tryCatch(
      upsertAuthUser({ email, role, capabilities: [...capabilities], name: "Admin" }),
    );
    if (upsertError) {
      console.error("[auth] failed to upsert auth.user", upsertError);
    }

    await setSessionCookie({ email, role, capabilities: [...capabilities], exp });
    return ok();
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(() => {
  clearSessionCookie();
  return ok();
});
