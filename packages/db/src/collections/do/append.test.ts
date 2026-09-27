import { describe, expect, test } from "bun:test";
import { createStateSchema } from "@durable-streams/state/db";
import { z } from "zod";
import { appendStreamEvent, appendStreamEvents } from "./append";
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

describe("appendStreamEvents", () => {
  test("appends all events then awaits every txid", async () => {
    const db = createMockDb();
    const events = [
      schema.presence.upsert({ value: { userId: "u1", status: "online" } }),
      schema.presence.upsert({ value: { userId: "u2", status: "away" } }),
    ];

    await appendStreamEvents(db, events);

    expect(db.appended).toHaveLength(2);
    expect(db.appended.map((e) => e.key)).toEqual(["u1", "u2"]);
    expect(db.awaited).toEqual(db.appended.map((e) => e.headers.txid!));
  });

  test("no-ops an empty event list", async () => {
    const db = createMockDb();
    await appendStreamEvents(db, []);
    expect(db.appended).toHaveLength(0);
    expect(db.awaited).toHaveLength(0);
  });
});
