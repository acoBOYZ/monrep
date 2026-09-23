import type { StandardSchemaV1 } from "@standard-schema/spec";
import type {
  CollectionOptions,
  DbClient,
  InferSchemaInput,
  InferSchemaOutput,
  NonSingleResult,
} from "@tanstack/react-db";
import type { TDoModuleId } from "../../types";
import type { DoStreamDb } from "./types";

/** One concrete descriptor → DbClient.collection + StreamDB rows (SSR). */
export async function materializeDoOne<
  TModule extends TDoModuleId,
  TSchema extends StandardSchemaV1,
  TKey extends string | number,
>(
  dbClient: DbClient,
  options: CollectionOptions<InferSchemaOutput<TSchema>, TKey, TSchema> & NonSingleResult,
  ensure: <T extends TDoModuleId>(moduleId: T) => Promise<DoStreamDb<T>>,
  moduleId: TModule,
  pick: (db: DoStreamDb<TModule>) => { toArray: ReadonlyArray<InferSchemaInput<TSchema>> },
): Promise<void> {
  const db = await ensure(moduleId);
  dbClient.collection(options, { initialData: [...pick(db).toArray] });
}
