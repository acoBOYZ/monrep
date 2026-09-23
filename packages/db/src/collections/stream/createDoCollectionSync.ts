import { streamDbStore } from "../../stream/store";
import type { Collection, SyncConfig } from "@tanstack/react-db";

type StreamCol<TRow extends object> = {
  toArray: ReadonlyArray<TRow>;
  subscribeChanges: Collection<TRow, string>["subscribeChanges"];
};

type CreateDoCollectionSyncOptions<TRow extends object> = {
  resolve: () => StreamCol<TRow> | null | undefined;
  createIndexes?: (
    collection: Parameters<SyncConfig<TRow, string | number>["sync"]>[0]["collection"],
  ) => void;
};

/** Server: hydrate/initialData. Browser: mirror StreamDB once acquired. */
export const createDoCollectionSync = <TRow extends object>({
  resolve,
  createIndexes,
}: CreateDoCollectionSyncOptions<TRow>): SyncConfig<TRow, string | number>["sync"] => {
  return ({ begin, write, commit, markReady, truncate, collection }) => {
    if (typeof window === "undefined") {
      markReady();
      return;
    }

    let streamUnsub: (() => void) | null = null;
    let indexesApplied = false;

    const attach = () => {
      if (streamUnsub) return;
      const streamCol = resolve();
      if (!streamCol) return;

      begin({ immediate: true });
      truncate();
      for (const row of streamCol.toArray) {
        write({ type: "insert", value: row });
      }
      void commit();

      if (!indexesApplied && createIndexes) {
        createIndexes(collection);
        indexesApplied = true;
      }
      markReady();

      const subscription = streamCol.subscribeChanges((changes) => {
        begin({ immediate: true });
        for (const change of changes) {
          if (change.type === "delete") {
            write({ type: "delete", key: change.key });
            continue;
          }
          write({ type: change.type, value: change.value });
        }
        void commit();
      });
      streamUnsub = () => {
        subscription.unsubscribe();
      };
    };

    attach();
    const storeSub = streamDbStore.subscribe(() => {
      attach();
    });

    return () => {
      streamUnsub?.();
      streamUnsub = null;
      storeSub.unsubscribe();
    };
  };
};
