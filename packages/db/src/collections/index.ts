/**
 * IMPORTANT — DO NOT REMOVE
 *
 * Entry for collections. Only re-exports gens + stream action helpers.
 */

export * from "./collections.do.gen";
export type { CreateDoModuleDbOpts, DoStreamDb } from "./stream/types";
export { createDoCollectionSync } from "./stream/createDoCollectionSync";
export { doCollection } from "./stream/doCollection";
export { createDoStreamDB } from "./stream/createDoStreamDB";
export {
  appendStreamEvent,
  createDeleteStreamAction,
  createUpsertStreamAction,
} from "./stream/streamActionHelpers";
