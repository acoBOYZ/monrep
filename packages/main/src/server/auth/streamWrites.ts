import { ensureStream } from "@monrep/db/stream/ensureStream";
import { streamPath } from "@monrep/db/stream/paths";
import { nextUlid } from "@monrep/utils/ulid";
import { env } from "cloudflare:workers";
import { LoginAttemptSchema, UpsertAuthUserSchema } from "./schemas";
import type { DurableStream } from "@durable-streams/client";
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
  const id = `user:${options.email.toLowerCase()}`;
  const now = new Date().toISOString();
  await appendUpsert({
    moduleId: "auth",
    type: "user",
    key: id,
    value: {
      id,
      email: options.email.toLowerCase(),
      name: options.name,
      role: options.role,
      capabilities: [...options.capabilities],
      createdAt: now,
      updatedAt: now,
    },
  });
};
