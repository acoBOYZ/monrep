// @generated: [AUTO-GENERATED] FILE. DO NOT EDIT.
//
// Generator : @monrep/codegen (typed useStreamDb hook)
// Task      : emitUseStreamDb
// Source    : DO modules under packages/main/src/db/do (package main)
//
// Regenerate: bun run codegen [-- --package <name>]
// Watch     : bun run --cwd packages/codegen watch [-- --package <name>]
//
// Edit instead: DO modules under packages/main/src/db/do (package main)

import { useStreamDb as useStreamDbBase } from "@monrep/db/stream";
import type { DO_MODULE_DB_FACTORIES } from "./collections.gen";

type TDoModuleId = keyof typeof DO_MODULE_DB_FACTORIES;
type ModuleDb<TModule extends TDoModuleId> = ReturnType<(typeof DO_MODULE_DB_FACTORIES)[TModule]>;

/** Typed StreamDB hook for this app's codegen catalog. */
export function useStreamDb<TModule extends TDoModuleId>(moduleId: TModule) {
  return useStreamDbBase(moduleId) as {
    db: ModuleDb<TModule> | null;
    isReady: boolean;
  };
}
