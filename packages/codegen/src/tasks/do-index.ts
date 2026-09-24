import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { writeIfChanged } from "../lib/emit";
import { logScaffolded, logUpdated } from "../lib/log";
import { pascal, safeId } from "../lib/naming";
import {
  parseDoModuleSource,
  resolveModuleLive,
  resolveModulePersist,
} from "../lib/parse-do-module";
import { paths } from "../paths";
import type { ParsedDoModule } from "../lib/parse-do-module";

const INDEX = "index.gen.ts";
const CREATE_IMPORT = `import { createDoModule, doTable } from "./create-do-module.gen";`;
const IGNORE = new Set(["index.ts", INDEX, "create-do-module.gen.ts"]);

const isDoModule = (name: string) =>
  name.endsWith(".ts") && !name.endsWith(".d.ts") && !IGNORE.has(name) && !name.endsWith(".gen.ts");

function normalizeCreate(fileName: string, source: string): string | null {
  const expectedName = path.basename(fileName, ".ts");
  const pattern = /createDoModule\((["'`])([^"'`]+)\1\)/;
  const hit = pattern.exec(source);
  if (!hit) return null;
  if (hit[2] === expectedName) return source;
  return source.replace(pattern, `createDoModule("${expectedName}")`);
}

function scaffoldDoModule(base: string): string {
  return `import { z } from "zod";
${CREATE_IMPORT}

export default createDoModule("${base}")({
  collections: {
    ${base}: doTable({
      primaryKey: "id",
      schema: {
        id: z.string(),
      },
    }),
  },
});
`;
}

async function syncFile(filePath: string): Promise<void> {
  const fileName = path.basename(filePath);
  if (!isDoModule(fileName) || !existsSync(filePath)) return;
  const source = await Bun.file(filePath).text();
  if (source.trim() === "") {
    const base = path.basename(fileName, ".ts");
    await Bun.write(filePath, scaffoldDoModule(base));
    logScaffolded(filePath);
    return;
  }
  if (!source.includes("createDoModule(")) {
    console.warn(`[@monrep/codegen] skipped do module ${fileName} (missing createDoModule)`);
    return;
  }

  let next = source;
  if (!/from\s*["']\.\/create-do-module\.gen["']/.test(next)) {
    next = `${CREATE_IMPORT}\n${next}`;
  }
  next = normalizeCreate(fileName, next) ?? next;

  if (next !== source) {
    await Bun.write(filePath, next);
    logUpdated(filePath);
  }
}

export type DoModuleFile = ParsedDoModule & {
  base: string;
  importName: string;
};

/** Epochs that were explicitly declared (omit = immortal). */
export function doModuleEpochMap(
  modules: Array<{ moduleId: string; streamEpoch: string | null }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const mod of modules) {
    if (mod.streamEpoch) out[mod.moduleId] = mod.streamEpoch;
  }
  return out;
}

async function syncIndex(): Promise<void> {
  const names = (await readdir(paths.dbDoDir, { withFileTypes: true }))
    .filter((e) => e.isFile() && isDoModule(e.name))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  const modules: Array<DoModuleFile> = await Promise.all(
    names.map(async (n) => {
      const base = path.basename(n, ".ts");
      const source = await Bun.file(path.join(paths.dbDoDir, n)).text();
      const parsed = parseDoModuleSource(source, base);
      if (!parsed) {
        throw new Error(
          `[@monrep/codegen] ${n}: expected export default createDoModule("${base}")(...)`,
        );
      }
      return {
        ...parsed,
        base,
        importName: `__${safeId(`${base}_do`)}`,
      };
    }),
  );

  const moduleIds = modules.map((m) => m.moduleId);
  const epochByModule = doModuleEpochMap(modules);
  const moduleUnion = moduleIds.map((id) => `"${id}"`).join(" | ");

  const collectionExports = modules.flatMap((m) =>
    m.collections.flatMap((c) => {
      const exportName = pascal(c.name);
      return [
        `export const ${exportName}DoSchema = ${m.importName}.collections.${c.name}.Schema;`,
        `export const ${exportName}DoMeta = {`,
        `  name: ${m.importName}.collections.${c.name}.name,`,
        `  streamModule: ${m.importName}.moduleId,`,
        `  streamEpoch: ${m.importName}.streamEpoch,`,
        `  streamLive: ${m.importName}.streamLive,`,
        `  streamPersist: ${m.importName}.streamPersist,`,
        `  type: ${m.importName}.collections.${c.name}.name,`,
        `  primaryKey: ${m.importName}.collections.${c.name}.primaryKey,`,
        `  indexes: ${m.importName}.collections.${c.name}.indexes,`,
        `} as const;`,
        "",
      ];
    }),
  );

  const rowBranches = modules.map(
    (m, index) =>
      `${index === 0 ? "  " : "  : "}TModule extends "${m.moduleId}"\n    ? TName extends keyof (typeof ${m.importName})["collections"]\n      ? z.output<(typeof ${m.importName})["collections"][TName]["Schema"]> & object\n      : never`,
  );
  const schemaBranches = modules.map(
    (m, index) =>
      `${index === 0 ? "  " : "  : "}TModule extends "${m.moduleId}"\n    ? TName extends keyof (typeof ${m.importName})["collections"]\n      ? (typeof ${m.importName})["collections"][TName]["Schema"]\n      : never`,
  );
  if (modules.length > 0) {
    rowBranches.push("  : never;");
    schemaBranches.push("  : never;");
  }

  const lines = [
    'import type { z } from "zod";',
    'import type { TStreamEpoch, TStreamLive } from "./create-do-module.gen";',
    ...modules.map((m) => `import ${m.importName} from "./${m.base}";`),
    "",
    `export type TDoModuleId = ${moduleUnion || "never"};`,
    "",
    ...(modules.length === 0
      ? [
        "export type DoCollectionRow<_TModule extends TDoModuleId, _TName extends string> = never;",
        "export type DoCollectionSchema<_TModule extends TDoModuleId, _TName extends string> = never;",
        "",
      ]
      : [
        "export type DoCollectionRow<",
        "  TModule extends TDoModuleId,",
        "  TName extends string,",
        "> =",
        ...rowBranches,
        "",
        "export type DoCollectionSchema<",
        "  TModule extends TDoModuleId,",
        "  TName extends string,",
        "> =",
        ...schemaBranches,
        "",
      ]),
    ...collectionExports,
    "export const DO_MODULE_EPOCH = {",
    ...moduleIds.map((id) => {
      const epoch = epochByModule[id];
      return `  "${id}": ${epoch ? `"${epoch}"` : "undefined"},`;
    }),
    "} as const satisfies Partial<Record<TDoModuleId, TStreamEpoch>>;",
    "",
    "export const DO_MODULE_LIVE = {",
    ...modules.map((m) => `  "${m.moduleId}": "${resolveModuleLive(m.streamLive)}",`),
    "} as const satisfies Record<TDoModuleId, TStreamLive>;",
    "",
    "export const DO_MODULE_PERSIST: Record<TDoModuleId, boolean> = {",
    ...modules.map(
      (m) => `  "${m.moduleId}": ${resolveModulePersist(m.streamPersist) ? "true" : "false"},`,
    ),
    "};",
    "",
    "export const DO_MODULES = {",
    ...modules.map((m) => `  "${m.moduleId}": ${m.importName},`),
    "} as const;",
    "",
    "export const DO_MODULE_STATE = {",
    ...modules.flatMap((m) => [
      `  "${m.moduleId}": {`,
      ...m.collections.map(
        (c) =>
          `    ${c.name}: { 
      schema: ${m.importName}.collections.${c.name}.Schema, 
      type: ${m.importName}.collections.${c.name}.name, 
      primaryKey: ${m.importName}.collections.${c.name}.primaryKey 
    },`,
      ),
      "  },",
    ]),
    "} as const;",
    "",
  ];

  await writeIfChanged(paths.dbDoIndexGen, `${lines.join("\n").trimEnd()}\n`, "doIndex");
}

export async function runDoIndex(): Promise<void> {
  const entries = await readdir(paths.dbDoDir, { withFileTypes: true }).catch(() => []);
  const files = entries
    .filter((e) => e.isFile() && isDoModule(e.name))
    .map((e) => path.join(paths.dbDoDir, e.name));
  await Promise.all(files.map(syncFile));
  await syncIndex();
}
