import path from "node:path";
import { fileURLToPath } from "node:url";

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** Monorepo root (parent of packages/). */
export const ROOT = path.resolve(PKG_ROOT, "../..");
export const CODEGEN_ROOT = PKG_ROOT;
