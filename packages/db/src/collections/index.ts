/**
 * IMPORTANT — DO NOT REMOVE
 *
 * Entry for collections. Only re-exports gens + stream action helpers.
 */

export * from "./collections.do.gen";
export { applyDoWriteFields, isDoWriteFieldUnset } from "./stream/applyDoWriteFields";
export type { DoWriteFieldGens } from "./stream/applyDoWriteFields";
export type { CreateDoModuleDbOpts, DoStreamDb } from "./stream/types";
export { createDoStreamDB } from "./stream/createDoStreamDB";
export {
  appendStreamEvent,
  createDeleteStreamAction,
  createUpsertStreamAction,
  parseDoWriteValue,
} from "./stream/streamActionHelpers";
