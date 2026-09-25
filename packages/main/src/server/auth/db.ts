import { ensureStream } from "@monrep/db/stream/ensureStream";
import { streamPath } from "@monrep/db/stream/paths";
import { eq, queryOnce } from "@tanstack/react-db";
import { env } from "cloudflare:workers";
import { authErrorMessage } from "./schemas";
import type { DurableStream } from "@durable-streams/client";
import type { TUserDo } from "@/db/types";
import { DO_MODULE_DB_FACTORIES } from "@/db/collections";
import { bindDoApp } from "@/db/host";
import { ROLE_CAPABILITIES } from "@/db/schemas";

bindDoApp();

type ServerWriteModule = "audit" | "auth";

/** Auth user after ensure — PK always present (filled by insert gens). */
export type AuthUser = TUserDo & { id: string };

export const openServerStream = async (moduleId: ServerWriteModule): Promise<DurableStream> => {
  const pathname = streamPath(moduleId);
  const url = `https://streams.internal${pathname}`;
  return ensureStream({
    url,
    contentType: "application/json",
    fetch: ((input, init) => {
      const request = new Request(input, init);
      const path = new URL(request.url).pathname;
      const stub = env.STREAMS.get(env.STREAMS.idFromName(path));
      return stub.fetch(request);
    }) as typeof fetch,
  });
};

export type AuthDb = Awaited<ReturnType<typeof loadAuthDb>>;

export const loadAuthDb = async () => {
  const stream = await openServerStream("auth");
  const db = DO_MODULE_DB_FACTORIES.auth({ stream });
  await db.preload();
  return db;
};

export const findUserByEmail = async (db: AuthDb, email: string): Promise<TUserDo | undefined> =>
  queryOnce({
    query: (q) =>
      q
        .from({ u: db.collections.user })
        .where(({ u }) => eq(u.email, email))
        .findOne(),
  });

const isLegacyUserId = (id: string): boolean => id.startsWith("user:");

const requireUserId = (user: TUserDo | undefined): AuthUser => {
  if (!user?.id) throw new Error(authErrorMessage({ _tag: "MissingId", message: "after upsert" }));
  return user as AuthUser;
};

/** Ensure admin user row exists; returns the live user (ULID id). */
export const ensureAdminUser = async (email: string, name = "Admin"): Promise<AuthUser> => {
  const normalized = email.toLowerCase();
  const role = "admin" as const;
  const capabilities = [...ROLE_CAPABILITIES[role]];
  const db = await loadAuthDb();
  try {
    const existing = await findUserByEmail(db, normalized);
    const profile = { email: normalized, name, role, capabilities };

    if (!existing) {
      await db.actions.upsertUser(profile).isPersisted.promise;
    } else if (!existing.id) {
      throw new Error(authErrorMessage({ _tag: "MissingId" }));
    } else if (isLegacyUserId(existing.id)) {
      await db.actions.deleteUser(existing.id).isPersisted.promise;
      await db.actions.upsertUser({ ...profile, createdAt: existing.createdAt }).isPersisted
        .promise;
    } else {
      await db.actions.upsertUser({ id: existing.id, ...profile, createdAt: existing.createdAt })
        .isPersisted.promise;
    }

    return requireUserId(await findUserByEmail(db, normalized));
  } finally {
    db.close();
  }
};
