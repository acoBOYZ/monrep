import type { DurableStream } from "@durable-streams/client";
import type { ChangeEvent, StreamDBMethods } from "@durable-streams/state/db";

/** Only the StreamDB surface these helpers touch, still derived from package types. */
export type StreamPersistDb = Pick<StreamDBMethods, "utils"> & {
  stream: Pick<DurableStream, "append">;
};

/**
 * Append ChangeEvents with overlapping `append()` calls so the Durable Streams
 * client can coalesce them into one JSON-array POST, then wait for all txids.
 */
export const appendStreamEvents = async <TValue>(
  db: StreamPersistDb,
  events: ReadonlyArray<ChangeEvent<TValue>>,
): Promise<void> => {
  if (events.length === 0) return;

  const txids: Array<string> = [];
  const appends = events.map((event) => {
    const txid = crypto.randomUUID();
    txids.push(txid);
    return db.stream.append(
      JSON.stringify({
        ...event,
        headers: { ...event.headers, txid },
      }),
    );
  });

  await Promise.all(appends);
  await Promise.all(txids.map((txid) => db.utils.awaitTxId(txid)));
};

/** Append a typed Durable State event and wait until StreamDB observes its txid. */
export const appendStreamEvent = async <TValue>(
  db: StreamPersistDb,
  event: ChangeEvent<TValue>,
): Promise<void> => appendStreamEvents(db, [event]);
