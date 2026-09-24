import { SchemaValidationError } from "@tanstack/react-db";
import { applyDoWriteFields } from "./applyDoWriteFields";
import type { DurableStream } from "@durable-streams/client";
import type {
  ActionDefinition,
  ChangeEvent,
  CollectionWithHelpers,
  StreamDBMethods,
} from "@durable-streams/state/db";
import type { z } from "zod";
import type { DoWriteFieldGens } from "./applyDoWriteFields";

/** Only the StreamDB surface these helpers touch, still derived from package types. */
type StreamPersistDb = Pick<StreamDBMethods, "utils"> & {
  stream: Pick<DurableStream, "append">;
};

type LiveCollectionOps<TValue extends object> = {
  has: (key: string) => boolean;
  insert: (value: TValue) => unknown;
  update: (key: string, callback: (draft: TValue) => void) => unknown;
  delete: (key: string) => unknown;
};

const peekPrimaryKey = <TValue extends object>(
  value: TValue,
  primaryKey: keyof TValue & string,
): string | undefined => {
  const raw = value[primaryKey];
  if (typeof raw !== "string" || raw.length === 0) return;
  return raw;
};

const readPrimaryKey = <TValue extends object>(
  value: TValue,
  primaryKey: keyof TValue & string,
): string => {
  const key = peekPrimaryKey(value, primaryKey);
  if (!key) {
    throw new Error(`Stream upsert requires a non-empty string primary key "${primaryKey}"`);
  }
  return key;
};

/** Parse after write gens; throw TanStack `SchemaValidationError` on failure. */
export const parseDoWriteValue = <TValue extends object>(
  schema: z.ZodType<TValue>,
  value: TValue,
  type: "insert" | "update",
): TValue => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new SchemaValidationError(
      type,
      parsed.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path,
      })),
    );
  }
  Object.assign(value, parsed.data);
  return value;
};

/** Append a typed Durable State event and wait until StreamDB observes its txid. */
export const appendStreamEvent = async <TValue>(
  db: StreamPersistDb,
  event: ChangeEvent<TValue>,
): Promise<void> => {
  const txid = crypto.randomUUID();
  await db.stream.append(
    JSON.stringify({
      ...event,
      headers: { ...event.headers, txid },
    }),
  );
  await db.utils.awaitTxId(txid);
};

const prepareUpsertValue = <TValue extends object>(options: {
  value: TValue;
  primaryKey: keyof TValue & string;
  collection: LiveCollectionOps<TValue>;
  schema: z.ZodType<TValue>;
  insertGens: DoWriteFieldGens | null | undefined;
  updateGens: DoWriteFieldGens | null | undefined;
}): { value: TValue; key: string; isUpdate: boolean } => {
  const { value, primaryKey, collection, schema, insertGens, updateGens } = options;
  const existingKey = peekPrimaryKey(value, primaryKey);
  const isUpdate = existingKey !== undefined && collection.has(existingKey);
  applyDoWriteFields(value, isUpdate ? updateGens : insertGens);
  parseDoWriteValue(schema, value, isUpdate ? "update" : "insert");
  return { value, key: readPrimaryKey(value, primaryKey), isUpdate };
};

export const createUpsertStreamAction = <TValue extends object>(options: {
  db: StreamPersistDb;
  helpers: CollectionWithHelpers<TValue>;
  collection: LiveCollectionOps<TValue>;
  primaryKey: keyof TValue & string;
  schema: z.ZodType<TValue>;
  insertGens?: DoWriteFieldGens | null;
  updateGens?: DoWriteFieldGens | null;
}): ActionDefinition<TValue> => {
  const { db, helpers, collection, primaryKey, schema, insertGens, updateGens } = options;
  return {
    onMutate: (value) => {
      const prepared = prepareUpsertValue({
        value,
        primaryKey,
        collection,
        schema,
        insertGens,
        updateGens,
      });
      if (prepared.isUpdate) {
        // Partial → live, then live → payload so mutationFn appends a full row
        // (StreamDB replaces on upsert; omitted audits like createdAt must survive).
        collection.update(prepared.key, (draft) => {
          Object.assign(draft, prepared.value);
          Object.assign(prepared.value, draft);
        });
        return;
      }
      collection.insert(prepared.value);
    },
    mutationFn: async (value) => {
      // Same object reference as onMutate — gens + schema parse already applied.
      await appendStreamEvent(db, helpers.upsert({ value }));
    },
  };
};

export const createDeleteStreamAction = <TValue extends object>(options: {
  db: StreamPersistDb;
  helpers: CollectionWithHelpers<TValue>;
  collection: LiveCollectionOps<TValue>;
}): ActionDefinition<string> => {
  const { db, helpers, collection } = options;
  return {
    onMutate: (key) => {
      if (!collection.has(key)) return;
      collection.delete(key);
    },
    mutationFn: async (key) => {
      await appendStreamEvent(db, helpers.delete({ key }));
    },
  };
};
