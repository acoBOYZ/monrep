import { describe, expect, test } from "bun:test";
import { createStateSchema } from "@durable-streams/state/db";
import { toArray } from "@monrep/utils";
import { SchemaValidationError } from "@tanstack/react-db";
import { z } from "zod";
import { createDeleteStreamAction, createUpsertStreamAction } from "./actions";
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
  const insertCalls: Array<T | Array<T>> = [];
  const deleteCalls: Array<string | Array<string>> = [];
  return {
    rows,
    insertCalls,
    deleteCalls,
    has: (key: string) => rows.has(key),
    insert: (value: T | Array<T>) => {
      insertCalls.push(value);
      for (const row of toArray(value)) {
        rows.set(row.userId, row);
      }
    },
    update: (key: string, callback: (draft: T) => void) => {
      const current = rows.get(key);
      if (!current) throw new Error(`missing ${key}`);
      const draft = { ...current };
      callback(draft);
      rows.set(key, draft);
    },
    delete: (key: string | Array<string>) => {
      deleteCalls.push(key);
      for (const id of toArray(key)) {
        rows.delete(id);
      }
    },
  };
};

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

  test("preserves createdAt on partial update in live row and appended event", async () => {
    const createdAtSchema = z.object({
      userId: z.string(),
      status: z.string(),
      createdAt: z.string().optional(),
      updatedAt: z.string().optional(),
    });

    type CreatedAtRow = z.infer<typeof createdAtSchema>;

    const createdAtCollection = createMockCollection<CreatedAtRow>();
    const db = createMockDb();
    let stamp = 0;

    const action = createUpsertStreamAction<CreatedAtRow>({
      db,
      helpers: schema.presence,
      collection: createdAtCollection,
      primaryKey: "userId",
      schema: createdAtSchema,
      insertGens: {
        createdAt: () => `t-insert-${++stamp}`,
        updatedAt: () => `t-updated-${stamp}`,
      },
      updateGens: {
        updatedAt: () => `t-updated-${++stamp}`,
      },
    });

    const insertPayload: CreatedAtRow = { userId: "u1", status: "online" };
    action.onMutate(insertPayload);
    expect(createdAtCollection.rows.get("u1")?.createdAt).toBe("t-insert-1");
    await action.mutationFn(insertPayload, undefined);
    expect(db.appended[0]?.value).toMatchObject({
      userId: "u1",
      createdAt: "t-insert-1",
    });

    // Partial upsert omits createdAt (e.g. presence rename).
    const updatePayload: CreatedAtRow = { userId: "u1", status: "away" };
    action.onMutate(updatePayload);
    expect(createdAtCollection.rows.get("u1")?.createdAt).toBe("t-insert-1");
    expect(createdAtCollection.rows.get("u1")?.updatedAt).toBe("t-updated-2");
    expect(stamp).toBe(2);

    await action.mutationFn(updatePayload, undefined);
    expect(db.appended[1]?.value).toMatchObject({
      userId: "u1",
      status: "away",
      createdAt: "t-insert-1",
      updatedAt: "t-updated-2",
    });
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
    expect(collection.deleteCalls).toHaveLength(0);

    action.onMutate("u1");
    expect(collection.rows.has("u1")).toBe(false);
    expect(collection.deleteCalls).toEqual([["u1"]]);

    await action.mutationFn("u1", undefined);
    expect(db.appended[0]?.headers.operation).toBe("delete");
    expect(db.appended[0]?.key).toBe("u1");
  });

  test("batch deletes multiple keys and no-ops empty arrays", async () => {
    const collection = createMockCollection<Row>();
    collection.insert({ userId: "u1", status: "online" });
    collection.insert({ userId: "u2", status: "away" });
    const db = createMockDb();
    const action = createDeleteStreamAction<Row>({
      db,
      helpers: schema.presence,
      collection,
    });

    action.onMutate([]);
    expect(collection.rows.size).toBe(2);
    expect(collection.deleteCalls).toHaveLength(0);

    action.onMutate(["u1", "missing", "u2"]);
    expect(collection.rows.size).toBe(0);
    expect(collection.deleteCalls).toEqual([["u1", "u2"]]);

    await action.mutationFn(["u1", "u2"], undefined);
    expect(db.appended).toHaveLength(2);
    expect(db.appended.map((e) => e.key)).toEqual(["u1", "u2"]);
  });
});

describe("createUpsertStreamAction batch", () => {
  test("batch inserts and updates multiple rows", async () => {
    const collection = createMockCollection<Row>();
    const db = createMockDb();
    const action = createUpsertStreamAction<Row>({
      db,
      helpers: schema.presence,
      collection,
      primaryKey: "userId",
      schema: rowSchema,
    });

    const rows: Array<Row> = [
      { userId: "u1", status: "online" },
      { userId: "u2", status: "away" },
    ];
    action.onMutate(rows);
    expect(collection.rows.get("u1")?.status).toBe("online");
    expect(collection.rows.get("u2")?.status).toBe("away");
    expect(collection.insertCalls).toEqual([rows]);

    await action.mutationFn(rows, undefined);
    expect(db.appended).toHaveLength(2);
    expect(db.appended.map((e) => e.key)).toEqual(["u1", "u2"]);

    action.onMutate([]);
    await action.mutationFn([], undefined);
    expect(db.appended).toHaveLength(2);
  });

  test("same-batch insert then update merges onto one pending insert", () => {
    const collection = createMockCollection<Row>();
    const db = createMockDb();
    const action = createUpsertStreamAction<Row>({
      db,
      helpers: schema.presence,
      collection,
      primaryKey: "userId",
      schema: rowSchema,
    });

    const insertRow: Row = { userId: "u1", status: "online" };
    const updateRow: Row = { userId: "u1", status: "away" };
    action.onMutate([insertRow, updateRow]);

    expect(collection.rows.get("u1")?.status).toBe("away");
    expect(collection.insertCalls).toHaveLength(1);
    expect(Array.isArray(collection.insertCalls[0])).toBe(true);
    expect(insertRow.status).toBe("away");
    expect(updateRow.status).toBe("away");
  });
});
