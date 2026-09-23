import { describe, expect, test } from "bun:test";
import { createStateSchema } from "@durable-streams/state/db";
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

const schema = createStateSchema({
  presence: { schema: rowSchema, type: "presence", primaryKey: "userId" },
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

const createMockCollection = () => {
  const rows = new Map<string, Row>();
  return {
    rows,
    has: (key: string) => rows.has(key),
    insert: (value: Row) => {
      rows.set(value.userId, value);
    },
    update: (key: string, callback: (draft: Row) => void) => {
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
    const collection = createMockCollection();
    const db = createMockDb();
    const action = createUpsertStreamAction<Row>({
      db,
      helpers: schema.presence,
      collection,
      primaryKey: "userId",
    });

    action.onMutate({ userId: "u1", status: "online" });
    expect(collection.rows.get("u1")).toEqual({ userId: "u1", status: "online" });

    action.onMutate({ userId: "u1", status: "away" });
    expect(collection.rows.get("u1")).toEqual({ userId: "u1", status: "away" });

    await action.mutationFn({ userId: "u1", status: "away" }, undefined);
    expect(db.appended[0]?.headers.operation).toBe("upsert");
    expect(db.appended[0]?.value).toEqual({ userId: "u1", status: "away" });
  });

  test("rejects so TanStack DB can roll the optimistic row back", () => {
    const collection = createMockCollection();
    const db = createMockDb({ failAppend: true });
    const action = createUpsertStreamAction<Row>({
      db,
      helpers: schema.presence,
      collection,
      primaryKey: "userId",
    });

    return expect(action.mutationFn({ userId: "u1", status: "online" }, undefined)).rejects.toThrow(
      "append failed",
    );
  });
});

describe("createDeleteStreamAction", () => {
  test("deletes existing rows and no-ops for keys that are not loaded", async () => {
    const collection = createMockCollection();
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
