import { getActiveTarget } from "./package-context";
import { CODEGEN_ROOT, ROOT } from "./root";

export { CODEGEN_ROOT, ROOT };

/** Active package paths (throws if CLI did not set a target). */
export const paths = {
  get codegenRoot() {
    return CODEGEN_ROOT;
  },
  get packageRoot() {
    return getActiveTarget().paths.packageRoot;
  },
  get packageName() {
    return getActiveTarget().packageName;
  },
  get doDir() {
    return getActiveTarget().paths.doDir;
  },
  get outDir() {
    return getActiveTarget().paths.outDir;
  },
  get dbRoot() {
    return getActiveTarget().paths.dbRoot;
  },
  get doGen() {
    return getActiveTarget().paths.doGen;
  },
  get typesGen() {
    return getActiveTarget().paths.typesGen;
  },
  get collectionsGen() {
    return getActiveTarget().paths.collectionsGen;
  },
  get hostGen() {
    return getActiveTarget().paths.hostGen;
  },
  get useStreamDbGen() {
    return getActiveTarget().paths.useStreamDbGen;
  },
} as const;
