import { toArray } from "@monrep/utils";
import { SchemaValidationError } from "@tanstack/react-db";
import { appendStreamEvents } from "./append";
import { applyDoWriteFields } from "./writeFields";
import type { ActionDefinition, CollectionWithHelpers } from "@durable-streams/state/db";
import type { z } from "zod";
import type { StreamPersistDb } from "./append";
import type { DoWriteFieldGens } from "./writeFields";

type LiveCollectionOps<TValue extends object> = {
  has: (key: string) => boolean;
  insert: (value: TValue | Array<TValue>) => unknown;
  update: (key: string, callback: (draft: TValue) => void) => unknown;
  delete: (key: string | Array<string>) => unknown;
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

const prepareUpsertValue = <TValue extends object>(options: {
  value: TValue;
  primaryKey: keyof TValue & string;
  hasExisting: (key: string) => boolean;
  schema: z.ZodType<TValue>;
  insertGens: DoWriteFieldGens | null | undefined;
  updateGens: DoWriteFieldGens | null | undefined;
}): { value: TValue; key: string; isUpdate: boolean } => {
  const { value, primaryKey, hasExisting, schema, insertGens, updateGens } = options;
  const existingKey = peekPrimaryKey(value, primaryKey);
  const isUpdate = existingKey !== undefined && hasExisting(existingKey);
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
}): ActionDefinition<TValue | Array<TValue>> => {
  const { db, helpers, collection, primaryKey, schema, insertGens, updateGens } = options;
  return {
    onMutate: (params) => {
      const inserts: Array<TValue> = [];
      const pendingInsertKeys = new Set<string>();
      for (const value of toArray(params)) {
        const prepared = prepareUpsertValue({
          value,
          primaryKey,
          hasExisting: (key) => collection.has(key) || pendingInsertKeys.has(key),
          schema,
          insertGens,
          updateGens,
        });
        if (prepared.isUpdate) {
          // Partial → live (or same-batch pending insert), then back onto the
          // mutation payload so StreamDB upserts a full row.
          if (collection.has(prepared.key)) {
            collection.update(prepared.key, (draft) => {
              Object.assign(draft, prepared.value);
              Object.assign(prepared.value, draft);
            });
          } else {
            const pending = inserts.find((row) => peekPrimaryKey(row, primaryKey) === prepared.key);
            if (!pending) {
              throw new Error(`Stream upsert missing pending insert for key "${prepared.key}"`);
            }
            Object.assign(pending, prepared.value);
            Object.assign(prepared.value, pending);
          }
          continue;
        }
        inserts.push(prepared.value);
        pendingInsertKeys.add(prepared.key);
      }
      if (inserts.length > 0) collection.insert(inserts);
    },
    mutationFn: async (params) => {
      // Same object references as onMutate — gens + schema parse already applied.
      await appendStreamEvents(
        db,
        toArray(params).map((value) => helpers.upsert({ value })),
      );
    },
  };
};

export const createDeleteStreamAction = <TValue extends object>(options: {
  db: StreamPersistDb;
  helpers: CollectionWithHelpers<TValue>;
  collection: LiveCollectionOps<TValue>;
}): ActionDefinition<string | Array<string>> => {
  const { db, helpers, collection } = options;
  return {
    onMutate: (params) => {
      const keys = toArray(params).filter((key) => collection.has(key));
      if (keys.length === 0) return;
      collection.delete(keys);
    },
    mutationFn: async (params) => {
      await appendStreamEvents(
        db,
        toArray(params).map((key) => helpers.delete({ key })),
      );
    },
  };
};
