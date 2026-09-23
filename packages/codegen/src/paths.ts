import path from "node:path";
import { fileURLToPath } from "node:url";

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ROOT = path.resolve(PKG_ROOT, "../..");

export const paths = {
  codegenRoot: PKG_ROOT,
  createDoModuleTemplate: path.join(PKG_ROOT, "templates/create-do-module.gen.ts.tpl"),
  dbDoDir: path.join(ROOT, "packages/db/src/do"),
  dbDoCreateModule: path.join(ROOT, "packages/db/src/do/create-do-module.gen.ts"),
  dbDoIndexGen: path.join(ROOT, "packages/db/src/do/index.gen.ts"),
  dbTypesIndexGen: path.join(ROOT, "packages/db/src/types/index.gen.ts"),
  dbCollectionsDoGen: path.join(ROOT, "packages/db/src/collections/collections.do.gen.ts"),
} as const;
