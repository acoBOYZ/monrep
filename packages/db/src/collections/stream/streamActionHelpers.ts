import type { DurableStream } from "@durable-streams/client";
import type {
  ActionDefinition,
  ChangeEvent,
  CollectionWithHelpers,
  StreamDBMethods,
} from "@durable-streams/state/db";

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

const readPrimaryKey = <TValue extends object>(
  value: TValue,
  primaryKey: keyof TValue & string,
): string => {
  const raw = value[primaryKey];
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`Stream upsert requires a non-empty string primary key "${primaryKey}"`);
  }
  return raw;
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

export const createUpsertStreamAction = <TValue extends object>(options: {
  db: StreamPersistDb;
  helpers: CollectionWithHelpers<TValue>;
  collection: LiveCollectionOps<TValue>;
  primaryKey: keyof TValue & string;
}): ActionDefinition<TValue> => {
  const { db, helpers, collection, primaryKey } = options;
  return {
    onMutate: (value) => {
      const key = readPrimaryKey(value, primaryKey);
      if (collection.has(key)) {
        collection.update(key, (draft) => {
          Object.assign(draft, value);
        });
        return;
      }
      collection.insert(value);
    },
    mutationFn: async (value) => {
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
