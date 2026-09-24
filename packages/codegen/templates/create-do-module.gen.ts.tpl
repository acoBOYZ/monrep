import { z } from "zod";
import { nextUlid } from "@monrep/utils/ulid";

/** Rolling Durable Stream id window. Omit = immortal stream, never GC. */
export type TStreamEpoch = "utc-day" | "utc-hour";

/** Catch-up then live transport. Default `"long-poll"`. */
export type TStreamLive = "sse" | "long-poll";

/** Generators available to `onInsert` / `onUpdate` (pass refs, do not call at define time). */
export type DoWriteCtx = {
  ulid: () => string;
  now: () => string;
  /** Reserved — throws until a DO counter exists. */
  inc: () => number;
};

export type DoFieldGens<TShape extends z.ZodRawShape> = {
  [K in keyof TShape & string]?: () => unknown;
};

/** Default write-gen map when `onInsert` / `onUpdate` are omitted (`keyof` is `never`). */
type NoWriteGens = Record<never, never>;

/**
 * Fail `doTable` props when write-gen objects include keys outside `schema`.
 * (Arrow returns skip excess-property checks against mapped `DoFieldGens`.)
 */
type WriteGensExactKeys<TShape extends z.ZodRawShape, TInsert, TUpdate> = (Exclude<
  keyof TInsert & string,
  keyof TShape & string
> extends never
  ? unknown
  : {
      /** Type error: remove these keys from `onInsert` — they are not in `schema`. */
      onInsertUnknownFields: Exclude<keyof TInsert & string, keyof TShape & string>;
    }) &
  (Exclude<keyof TUpdate & string, keyof TShape & string> extends never
    ? unknown
    : {
        /** Type error: remove these keys from `onUpdate` — they are not in `schema`. */
        onUpdateUnknownFields: Exclude<keyof TUpdate & string, keyof TShape & string>;
      });

export type DoCollectionProps<TShape extends z.ZodRawShape> = {
  /** Zod column map — binds `primaryKey` / `indexes` / write gens to these keys. */
  schema: TShape;
  /** Primary key field on the row object. */
  primaryKey: keyof TShape & string;
  /** Columns to index for filters / orderBy / infinite. Omit = none. */
  indexes?: ReadonlyArray<keyof TShape & string>;
  /**
   * Field generators for inserts. Keys must be schema fields; values are
   * generator refs (`ctx.ulid`, `ctx.now`). Fills only when the caller left
   * the field unset (`undefined` / `null` / `""`).
   * Always wrap collections in `doTable(...)` (scaffold default) so unknown keys error.
   */
  onInsert?: (args: { ctx: DoWriteCtx }) => DoFieldGens<TShape>;
  /**
   * Field generators for updates. Same omit-only fill rule as `onInsert`.
   */
  onUpdate?: (args: { ctx: DoWriteCtx }) => DoFieldGens<TShape>;
};

/**
 * Define one collection with schema-keyed `onInsert` / `onUpdate` (excess keys error).
 * Required for write-gen key safety — bare objects inside `collections` skip the check.
 */
export function doTable<
  const TShape extends z.ZodRawShape,
  const TInsert extends DoFieldGens<TShape> = NoWriteGens,
  const TUpdate extends DoFieldGens<TShape> = NoWriteGens,
>(
  props: {
    schema: TShape;
    primaryKey: keyof TShape & string;
    indexes?: ReadonlyArray<keyof TShape & string>;
    onInsert?: (args: { ctx: DoWriteCtx }) => TInsert;
    onUpdate?: (args: { ctx: DoWriteCtx }) => TUpdate;
  } & WriteGensExactKeys<TShape, TInsert, TUpdate>,
): DoCollectionProps<TShape> {
  return props;
}

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
  primaryKey: keyof TShape & string;
  indexes: ReadonlyArray<keyof TShape & string>;
  Schema: z.ZodObject<TShape>;
  insertGens: DoFieldGens<TShape> | null;
  updateGens: DoFieldGens<TShape> | null;
};

const doWriteCtx: DoWriteCtx = {
  ulid: () => nextUlid(null),
  now: () => new Date().toISOString(),
  inc: () => {
    throw new Error("DoWriteCtx.inc is not implemented yet (needs a DO counter)");
  },
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
        primaryKey: col.primaryKey,
        indexes: col.indexes ?? [],
        Schema: z.object(col.schema),
        insertGens: col.onInsert?.({ ctx: doWriteCtx }) ?? null,
        updateGens: col.onUpdate?.({ ctx: doWriteCtx }) ?? null,
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
