// @generated: [AUTO-GENERATED] FILE. DO NOT EDIT.
//
// Generator : @monrep/codegen (DOHost + bindDoApp)
// Task      : emitHost
// Source    : DO modules under packages/main/src/db/do (package main)
//
// Regenerate: bun run codegen [-- --package <name>]
// Watch     : bun run --cwd packages/codegen watch [-- --package <name>]
//
// Edit instead: DO modules under packages/main/src/db/do (package main)

import { StreamDbHost } from "@monrep/db/stream";
import { bindDoApp } from "./bind.gen";

/**
 * App stream host (not a provider). Mount once under the authenticated shell.
 * Acquires modules via `StreamDbHost`. Catalog bind runs at module load below.
 */
export function DOHost() {
  return <StreamDbHost />;
}

/** Importing `DOHost` / `@/db/host` binds the catalog before any hooks run. */
bindDoApp();
