// @generated: [AUTO-GENERATED] FILE. DO NOT EDIT.
//
// Generator : @monrep/codegen (DO registry bind)
// Task      : emitRegistry
// Source    : DO modules under packages/main/src/db/do (package main)
//
// Regenerate: bun run codegen [-- --package <name>]
// Watch     : bun run --cwd packages/codegen watch [-- --package <name>]
//
// Edit instead: DO modules under packages/main/src/db/do (package main)

import { bindDoRegistry } from "@monrep/db/registry";
import { DO_MODULE_DB_FACTORIES } from "./collections.gen";
import {
  DO_MODULES,
  DO_MODULE_EPOCH,
  DO_MODULE_LIVE,
  DO_MODULE_PERSIST,
  DO_MODULE_STATE,
} from "./do.gen";

/** Bind app DO catalog into `@monrep/db` stream runtime. */
bindDoRegistry({
  epoch: DO_MODULE_EPOCH,
  persist: DO_MODULE_PERSIST,
  live: DO_MODULE_LIVE,
  state: DO_MODULE_STATE,
  modules: DO_MODULES,
  factories: DO_MODULE_DB_FACTORIES,
});
