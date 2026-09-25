import path from "node:path";
import { writeIfChanged } from "../lib/emit";
import { paths } from "../paths";

export async function runEmitHost(): Promise<void> {
  const bindBody = `import { bindDoRegistry } from "@monrep/db/registry";
import { DO_MODULE_DB_FACTORIES } from "./collections.gen";
import {
  DO_MODULES,
  DO_MODULE_EPOCH,
  DO_MODULE_LIVE,
  DO_MODULE_PERSIST,
  DO_MODULE_STATE,
} from "./do.gen";
import type { DoRegistry } from "@monrep/db/registry";

/** App DO catalog for this Worker (codegen). */
export const DO_BINDINGS: DoRegistry = {
  epoch: DO_MODULE_EPOCH,
  persist: DO_MODULE_PERSIST,
  live: DO_MODULE_LIVE,
  state: DO_MODULE_STATE,
  modules: DO_MODULES,
  factories: DO_MODULE_DB_FACTORIES,
};

/**
 * Bind this Worker's DO catalog into \`@monrep/db\`.
 * Use from Worker / serverFn entry (no React). Client bind happens via \`host.gen\` import.
 */
export function bindDoApp(): void {
  bindDoRegistry(DO_BINDINGS);
}
`;

  const hostBody = `import { StreamDbHost } from "@monrep/db/stream";
import { bindDoApp } from "./bind.gen";

/**
 * App stream host (not a provider). Mount once under the authenticated shell.
 * Acquires modules via \`StreamDbHost\`. Catalog bind runs at module load below.
 */
export function DOHost() {
  return <StreamDbHost />;
}

/** Importing \`DOHost\` / \`@/db/host\` binds the catalog before any hooks run. */
bindDoApp();
`;

  const bindGen = path.join(paths.outDir, "bind.gen.ts");
  await writeIfChanged(bindGen, bindBody, "emitHost");
  await writeIfChanged(paths.hostGen, hostBody, "emitHost");
}
