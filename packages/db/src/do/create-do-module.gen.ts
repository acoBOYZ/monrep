// @generated — AUTO-GENERATED FILE. DO NOT EDIT.
//
// Generator : @monrep/codegen (createDoModule factory)
// Task      : doCreateSchema
// Source    : packages/codegen/templates/create-do-module.gen.ts.tpl
//
// Regenerate: bun run codegen
// Watch     : bun run --cwd packages/codegen watch
//
// Edit instead: packages/codegen/templates/create-do-module.gen.ts.tpl

import { z } from "zod";

/** Rolling Durable Stream id window. Omit = immortal stream, never GC. */
export type TStreamEpoch = "utc-day" | "utc-hour";

/** Catch-up then live transport. Default `"long-poll"`. */
export type TStreamLive = "sse" | "long-poll";

export type DoCollectionProps<TShape extends z.ZodRawShape> = {
  /** Durable State event `type` discriminator. */
  type: string;
  /** Zod column map — binds `primaryKey` / `indexes` to these keys. */
  schema: TShape;
  /** Primary key field on the row object. */
  primaryKey: keyof TShape & string;
  /** Columns to index for filters / orderBy / infinite. Omit = none. */
  indexes?: ReadonlyArray<keyof TShape & string>;
};

export type CreateDoModuleProps<
  TCols extends {
    [K in keyof TCols]: TCols[K] extends { schema: infer S extends z.ZodRawShape }
      ? DoCollectionProps<S>
      : never;
  },
> = {
  /**
   * Rolling stream-id window. Omit = immortal stream, never GC.
   */
  streamEpoch?: TStreamEpoch;
  /**
   * Live transport after catch-up. Omit = `"long-poll"`.
   */
  streamLive?: TStreamLive;
  /**
   * Persist catch-up resume offset in sessionStorage across reloads.
   * Omit = false (in-memory offset for this tab session only).
   */
  streamPersist?: boolean;
  collections: TCols;
};

type BuiltCollection<TName extends string, TShape extends z.ZodRawShape> = {
  name: TName;
  type: string;
  primaryKey: keyof TShape & string;
  indexes: ReadonlyArray<keyof TShape & string>;
  Schema: z.ZodObject<TShape>;
};

/**
 * Define a Durable Streams / StreamDB module (one stream connection).
 * File basename must match `moduleId`. Nested `collections` are materialized
 * together in one StreamDB.
 */
export function createDoModule<const TId extends string>(moduleId: TId) {
  return <
    const TCols extends {
      [K in keyof TCols]: TCols[K] extends { schema: infer S extends z.ZodRawShape }
        ? DoCollectionProps<S>
        : never;
    },
  >({
    streamEpoch,
    streamLive = "long-poll",
    streamPersist = false,
    collections,
  }: CreateDoModuleProps<TCols>) => {
    const built: Record<string, BuiltCollection<string, z.ZodRawShape>> = {};
    for (const name of Object.keys(collections)) {
      const col = collections[name as keyof TCols];
      if (!col) continue;
      built[name] = {
        name,
        type: col.type,
        primaryKey: col.primaryKey,
        indexes: col.indexes ?? [],
        Schema: z.object(col.schema),
      };
    }

    return {
      moduleId,
      streamEpoch,
      streamLive,
      streamPersist,
      collections: built as {
        [K in keyof TCols & string]: BuiltCollection<K, TCols[K]["schema"]>;
      },
    };
  };
}
