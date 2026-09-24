import { BasicIndex, collectionOptions } from "@tanstack/react-db";
import { DO_MODULES } from "../../do";
import { streamDbStore } from "../../stream/store";
import { createDoCollectionSync } from "./createDoCollectionSync";
import type { Collection, CollectionOptions } from "@tanstack/react-db";
import type { DoCollectionRow, DoCollectionSchema } from "../../do";
import type { TDoModuleId } from "../../types";

type AnyCol = {
  [
    M in TDoModuleId
  ]: (typeof DO_MODULES)[M]["collections"][keyof (typeof DO_MODULES)[M]["collections"]];
}[TDoModuleId];

type LiveCol = {
  toArray: ReadonlyArray<object>;
  subscribeChanges: Collection<object, string>["subscribeChanges"];
};

function asLiveCol(value: unknown): LiveCol | undefined {
  if (typeof value !== "object" || value === null) return;
  if (!("toArray" in value) || !("subscribeChanges" in value)) return;
  return value as LiveCol;
}

/**
 * Descriptor for a DO collection. New shapes: edit `src/do/*.ts`, run codegen.
 */
export function doCollection<
  const TModule extends TDoModuleId,
  const TName extends keyof (typeof DO_MODULES)[TModule]["collections"] & string,
>(
  moduleId: TModule,
  name: TName,
): CollectionOptions<
  DoCollectionRow<TModule, TName>,
  string | number,
  DoCollectionSchema<TModule, TName>
>;
export function doCollection(moduleId: TDoModuleId, name: string) {
  const cols: Record<string, AnyCol> = DO_MODULES[moduleId].collections;
  const { Schema, primaryKey, indexes } = cols[name]!;
  const id = `do:${moduleId}:${name}`;
  return collectionOptions(id, () => ({
    id,
    getKey: (row: Record<string, string | number>) => row[primaryKey],
    schema: Schema,
    sync: {
      sync: createDoCollectionSync<object>({
        resolve: () => {
          const live = streamDbStore.state.dbs[moduleId]?.collections;
          if (!live) return;
          const col = asLiveCol(Reflect.get(live, name));
          if (!col) return;
          return {
            toArray: [...col.toArray],
            subscribeChanges: (cb) => col.subscribeChanges(cb),
          };
        },
        createIndexes: (collection) => {
          for (const indexCol of indexes) {
            collection.createIndex(
              (row) => {
                const rec: Record<string, unknown> = { ...row };
                return rec[indexCol];
              },
              { indexType: BasicIndex },
            );
          }
        },
      }),
    },
  }));
}
