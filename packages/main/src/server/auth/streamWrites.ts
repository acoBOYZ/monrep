import { DO_MODULE_DB_FACTORIES } from "@monrep/db/collections";
import { ensureStream } from "@monrep/db/stream/ensureStream";
import { streamPath } from "@monrep/db/stream/paths";
import { nextUlid } from "@monrep/utils/ulid";
import { eq, queryOnce } from "@tanstack/react-db";
import { env } from "cloudflare:workers";
import { LoginAttemptSchema, UpsertAuthUserSchema } from "./schemas";
import type { DurableStream } from "@durable-streams/client";
import type { TUserDo } from "@monrep/db/types";
import type { LoginAttemptInput, UpsertAuthUserInput } from "./schemas";

type ServerWriteModule = "audit" | "auth";

/** In-process DO stub fetch — avoids Worker self-HTTP from serverFns. */
const openServerStream = async (moduleId: ServerWriteModule): Promise<DurableStream> => {
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

const appendUpsert = async (options: {
  moduleId: ServerWriteModule;
  type: string;
  key: string;
  value: Record<string, unknown>;
}): Promise<void> => {
  const stream = await openServerStream(options.moduleId);
  const txid = crypto.randomUUID();
  await stream.append(
    JSON.stringify({
      type: options.type,
      key: options.key,
      value: options.value,
      headers: { operation: "upsert", txid },
    }),
  );
};

const loadAuthDb = async () => {
  const stream = await openServerStream("auth");
  const db = DO_MODULE_DB_FACTORIES.auth({ stream });
  await db.preload();
  return db;
};

const findUserByEmail = async (
  db: Awaited<ReturnType<typeof loadAuthDb>>,
  email: string,
): Promise<TUserDo | undefined> =>
  queryOnce({
    query: (q) =>
      q
        .from({ u: db.collections.user })
        .where(({ u }) => eq(u.email, email))
        .findOne(),
  });

const isLegacyUserId = (id: string): boolean => id.startsWith("user:");

export const recordLoginAttempt = async (input: LoginAttemptInput): Promise<void> => {
  const data = LoginAttemptSchema.parse(input);
  const id = nextUlid(null);
  const createdAt = new Date().toISOString();
  await appendUpsert({
    moduleId: "audit",
    type: "security",
    key: id,
    value: {
      id,
      email: data.email,
      ip: data.ip,
      success: data.success,
      userAgent: data.userAgent,
      createdAt,
    },
  });
};

export const upsertAuthUser = async (input: UpsertAuthUserInput): Promise<void> => {
  const options = UpsertAuthUserSchema.parse(input);
  const email = options.email.toLowerCase();
  const db = await loadAuthDb();

  try {
    const existing = await findUserByEmail(db, email);
    const profile = {
      email,
      name: options.name,
      role: options.role,
      capabilities: [...options.capabilities],
    };

    if (!existing) {
      await db.actions.upsertUser({ id: "", ...profile }).isPersisted.promise;
      return;
    }

    if (isLegacyUserId(existing.id)) {
      await db.actions.deleteUser(existing.id).isPersisted.promise;
      await db.actions.upsertUser({
        id: "",
        ...profile,
        createdAt: existing.createdAt,
      }).isPersisted.promise;
      return;
    }

    await db.actions.upsertUser({
      id: existing.id,
      ...profile,
      createdAt: existing.createdAt,
    }).isPersisted.promise;
  } finally {
    db.close();
  }
};
