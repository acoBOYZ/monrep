import { describe, expect, test } from "bun:test";
import { createStateSchema } from "@durable-streams/state/db";
import { SchemaValidationError } from "@tanstack/react-db";
import { z } from "zod";
import {
  appendStreamEvent,
  createDeleteStreamAction,
  createUpsertStreamAction,
} from "./streamActionHelpers";
import type { ChangeEvent } from "@durable-streams/state";

const rowSchema = z.object({
  userId: z.string(),
  status: z.string(),
});

type Row = z.infer<typeof rowSchema>;

const ulidRowSchema = z.object({
  userId: z.ulid(),
  status: z.string(),
});

type UlidRow = z.infer<typeof ulidRowSchema>;

const schema = createStateSchema({
  presence: { schema: rowSchema, type: "presence", primaryKey: "userId" },
});

const ulidSchema = createStateSchema({
  presence: { schema: ulidRowSchema, type: "presence", primaryKey: "userId" },
});

type AppendBody = Uint8Array | string | Promise<Uint8Array | string>;

const createMockDb = (options?: { failAppend?: boolean; failAwait?: boolean }) => {
  const appended: Array<ChangeEvent<Row>> = [];
  const awaited: Array<string> = [];
  return {
    appended,
    awaited,
    stream: {
      append: async (body: AppendBody) => {
        if (options?.failAppend) throw new Error("append failed");
        appended.push(JSON.parse(String(await body)) as ChangeEvent<Row>);
      },
    },
    utils: {
      awaitTxId: (txid: string) => {
        if (options?.failAwait) return Promise.reject(new Error("txid timeout"));
        awaited.push(txid);
        return Promise.resolve();
      },
    },
  };
};

const createMockCollection = <T extends { userId: string }>() => {
  const rows = new Map<string, T>();
  return {
    rows,
    has: (key: string) => rows.has(key),
    insert: (value: T) => {
      rows.set(value.userId, value);
    },
    update: (key: string, callback: (draft: T) => void) => {
      const current = rows.get(key);
      if (!current) throw new Error(`missing ${key}`);
      const draft = { ...current };
      callback(draft);
      rows.set(key, draft);
    },
    delete: (key: string) => {
      rows.delete(key);
    },
  };
};

describe("appendStreamEvent", () => {
  test("injects a txid and waits for that same txid", async () => {
    const db = createMockDb();

    await appendStreamEvent(
      db,
      schema.presence.upsert({ value: { userId: "u1", status: "online" } }),
    );

    expect(db.appended).toHaveLength(1);
    const event = db.appended[0]!;
    expect(event.headers.operation).toBe("upsert");
    expect(event.key).toBe("u1");
    expect(db.awaited).toEqual([event.headers.txid!]);
  });

  test("rejects when the stream never observes the txid", () => {
    const db = createMockDb({ failAwait: true });

    const persisted = appendStreamEvent(
      db,
      schema.presence.upsert({ value: { userId: "u1", status: "online" } }),
    );

    return expect(persisted).rejects.toThrow("txid timeout");
  });
});

describe("createUpsertStreamAction", () => {
  test("inserts missing rows, updates existing rows, and appends an upsert", async () => {
    const collection = createMockCollection<Row>();
    const db = createMockDb();
    const action = createUpsertStreamAction<Row>({
      db,
      helpers: schema.presence,
      collection,
      primaryKey: "userId",
      schema: rowSchema,
    });

    action.onMutate({ userId: "u1", status: "online" });
    expect(collection.rows.get("u1")).toEqual({ userId: "u1", status: "online" });

    action.onMutate({ userId: "u1", status: "away" });
    expect(collection.rows.get("u1")).toEqual({ userId: "u1", status: "away" });

    await action.mutationFn({ userId: "u1", status: "away" }, undefined);
    expect(db.appended[0]?.headers.operation).toBe("upsert");
    expect(db.appended[0]?.value).toEqual({ userId: "u1", status: "away" });
  });

  test("does not wipe optional fields on update when caller omits them", async () => {
    const createdAtSchema = z.object({
      userId: z.string(),
      status: z.string(),
      createdAt: z.string().optional(),
    });

    type CreatedAtRow = z.infer<typeof createdAtSchema>;

    const createdAtCollection = createMockCollection<CreatedAtRow>();
    const db = createMockDb();

    const action = createUpsertStreamAction<CreatedAtRow>({
      db,
      helpers: schema.presence,
      collection: createdAtCollection,
      primaryKey: "userId",
      schema: createdAtSchema,
      insertGens: {
        createdAt: () => "t-insert",
      },
      updateGens: null,
    });

    action.onMutate({ userId: "u1", status: "online" });
    expect(createdAtCollection.rows.get("u1")?.createdAt).toBe("t-insert");

    // Simulate a partial upsert that omits createdAt (e.g. rename payload).
    action.onMutate({ userId: "u1", status: "away" });
    expect(createdAtCollection.rows.get("u1")?.createdAt).toBe("t-insert");
  });

  test("rejects so TanStack DB can roll the optimistic row back", () => {
    const collection = createMockCollection<Row>();
    const db = createMockDb({ failAppend: true });
    const action = createUpsertStreamAction<Row>({
      db,
      helpers: schema.presence,
      collection,
      primaryKey: "userId",
      schema: rowSchema,
    });

    return expect(action.mutationFn({ userId: "u1", status: "online" }, undefined)).rejects.toThrow(
      "append failed",
    );
  });

  test("throws SchemaValidationError for invalid fields before insert", () => {
    const collection = createMockCollection<UlidRow>();
    const db = createMockDb();
    const action = createUpsertStreamAction<UlidRow>({
      db,
      helpers: ulidSchema.presence,
      collection,
      primaryKey: "userId",
      schema: ulidRowSchema,
    });

    expect(() => action.onMutate({ userId: "ada", status: "online" })).toThrow(
      SchemaValidationError,
    );
    expect(collection.rows.size).toBe(0);
    expect(db.appended).toHaveLength(0);
  });

  test("accepts valid ULID and insertGens-filled empty primary key", () => {
    const collection = createMockCollection<UlidRow>();
    const db = createMockDb();
    const validUlid = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
    const action = createUpsertStreamAction<UlidRow>({
      db,
      helpers: ulidSchema.presence,
      collection,
      primaryKey: "userId",
      schema: ulidRowSchema,
      insertGens: {
        userId: () => validUlid,
      },
    });

    action.onMutate({ userId: validUlid, status: "online" });
    expect(collection.rows.get(validUlid)).toEqual({
      userId: validUlid,
      status: "online",
    });

    action.onMutate({ userId: "", status: "away" });
    expect(collection.rows.get(validUlid)?.status).toBe("away");
  });
});

describe("createDeleteStreamAction", () => {
  test("deletes existing rows and no-ops for keys that are not loaded", async () => {
    const collection = createMockCollection<Row>();
    collection.insert({ userId: "u1", status: "online" });
    const db = createMockDb();
    const action = createDeleteStreamAction<Row>({
      db,
      helpers: schema.presence,
      collection,
    });

    action.onMutate("missing");
    expect(collection.rows.has("u1")).toBe(true);

    action.onMutate("u1");
    expect(collection.rows.has("u1")).toBe(false);

    await action.mutationFn("u1", undefined);
    expect(db.appended[0]?.headers.operation).toBe("delete");
    expect(db.appended[0]?.key).toBe("u1");
  });
});
