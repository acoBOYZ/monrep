import { eq, queryOnce } from "@tanstack/react-db";
import { AuthTaggedError } from "./schemas";
import type { TUserDo } from "@/db/types";
import { DO_MODULE_DB_FACTORIES } from "@/db/collections";
import { bindDoApp } from "@/db/host";
import { ROLE_CAPABILITIES } from "@/db/schemas";
import { openServerStream } from "@/server/doStream";

bindDoApp();

/** Auth user after ensure — PK always present (filled by insert gens). */
export type AuthUser = TUserDo & { id: string };

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
  if (!user?.id) throw new AuthTaggedError({ _tag: "MissingId", message: "after upsert" });
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
      throw new AuthTaggedError({ _tag: "MissingId" });
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
