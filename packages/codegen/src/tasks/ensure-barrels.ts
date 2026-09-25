import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { logScaffolded, logUpdated } from "../lib/log";
import { paths } from "../paths";

type Barrel = {
  fileName: string;
  body: string;
};

const BARREL_HEADER = `// @generated and managed by @monrep/codegen. Do not edit or delete manually.
// Restored by: bun run codegen | bun run --cwd packages/codegen watch
//
`;

const BARRELS: Array<Barrel> = [
  {
    fileName: "registry.ts",
    body: `${BARREL_HEADER}import "./codegen/registry.gen";\n`,
  },
  {
    fileName: "useStreamDb.ts",
    body: `${BARREL_HEADER}export { useStreamDb } from "./codegen/useStreamDb.gen";\n`,
  },
  {
    fileName: "collections.ts",
    body: `${BARREL_HEADER}export * from "./codegen/collections.gen";\n`,
  },
  {
    fileName: "types.ts",
    body: `${BARREL_HEADER}export * from "./codegen/types.gen";\n`,
  },
];

/** Public barrel filenames under dbRoot (watched for delete → recreate). */
export const BARREL_FILE_NAMES = new Set(BARRELS.map((b) => b.fileName));

/** Create / refresh public barrels under dbRoot (canonical scaffold only). */
export function runEnsureBarrels(): void {
  mkdirSync(paths.dbRoot, { recursive: true });
  for (const barrel of BARRELS) {
    const filePath = path.join(paths.dbRoot, barrel.fileName);
    if (existsSync(filePath)) {
      const cur = readFileSync(filePath, "utf8");
      if (cur === barrel.body) continue;
      // Upgrade bare/old scaffolds; leave unknown custom barrels alone.
      const isOurScaffold =
        cur.includes("managed by @monrep/codegen") ||
        cur.trim() === 'import "./codegen/registry.gen";' ||
        cur.trim() === 'export { useStreamDb } from "./codegen/useStreamDb.gen";' ||
        cur.trim() === 'export * from "./codegen/collections.gen";' ||
        cur.trim() === 'export * from "./codegen/types.gen";';
      if (!isOurScaffold) continue;
      writeFileSync(filePath, barrel.body, "utf8");
      logUpdated(filePath);
      continue;
    }
    writeFileSync(filePath, barrel.body, "utf8");
    logScaffolded(filePath);
  }
}
