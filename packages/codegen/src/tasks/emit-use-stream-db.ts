import { writeIfChanged } from "../lib/emit";
import { paths } from "../paths";

export async function runEmitUseStreamDb(): Promise<void> {
  const body = `import { useStreamDb as useStreamDbBase } from "@monrep/db/stream";
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
`;

  await writeIfChanged(paths.useStreamDbGen, body, "emitUseStreamDb");
}
