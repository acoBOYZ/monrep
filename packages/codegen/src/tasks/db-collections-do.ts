import { readdir } from "node:fs/promises";
import path from "node:path";
import { writeIfChanged } from "../lib/emit";
import { pascal } from "../lib/naming";
import { parseDoModuleSource } from "../lib/parse-do-module";
import { paths } from "../paths";

const IGNORE = new Set(["index.ts"]);

const isDoModule = (name: string) =>
  name.endsWith(".ts") && !name.endsWith(".d.ts") && !IGNORE.has(name) && !name.endsWith(".gen.ts");

type CollectionEntry = {
  name: string;
  exportName: string;
  streamModule: string;
  primaryKey: string;
  indexes: Array<string>;
};

const actionName = (op: "upsert" | "delete", collectionName: string): string =>
  `${op}${pascal(collectionName)}`;

export function buildDbCollectionsDoSource(entries: Array<CollectionEntry>): string {
  const byModule = new Map<string, Array<CollectionEntry>>();
  for (const entry of entries) {
    const list = byModule.get(entry.streamModule) ?? [];
    list.push(entry);
    byModule.set(entry.streamModule, list);
  }

  const moduleIds = [...byModule.keys()].sort((a, b) => a.localeCompare(b));
  const sharedTypeNames = entries.map((c) => `T${c.exportName}Do`);

  const factoryBlocks = moduleIds.flatMap((moduleId) => {
    const moduleEntries = byModule.get(moduleId)!;
    const actionLines = moduleEntries.flatMap((c) => {
      const upsert = actionName("upsert", c.name);
      const del = actionName("delete", c.name);
      return [
        `      ${upsert}: createUpsertStreamAction({ db, helpers: state.${c.name}, collection: db.collections.${c.name}, primaryKey: "${c.primaryKey}", schema: DO_MODULES["${c.streamModule}"].collections.${c.name}.Schema, insertGens: DO_MODULES["${c.streamModule}"].collections.${c.name}.insertGens, updateGens: DO_MODULES["${c.streamModule}"].collections.${c.name}.updateGens }),`,
        `      ${del}: createDeleteStreamAction({ db, helpers: state.${c.name}, collection: db.collections.${c.name} }),`,
      ];
    });
    const indexLines = moduleEntries.flatMap((c) =>
      c.indexes.map(
        (field) =>
          `  sdb.collections.${c.name}.createIndex((r) => r.${field}, { indexType: BasicIndex });`,
      ),
    );
    return [
      `const create${pascal(moduleId)}StreamDB = (opts: CreateDoModuleDbOpts) => {`,
      `  const sdb = createDoStreamDB(DO_MODULE_STATE["${moduleId}"], { ...opts, live: opts.live ?? DO_MODULE_LIVE["${moduleId}"] }, ({ db, state }) => ({`,
      ...actionLines,
      "  }));",
      ...indexLines,
      "  return sdb;",
      "};",
      "",
    ];
  });

  const actionDefinitionBlocks = moduleIds.flatMap((moduleId) => {
    const moduleEntries = byModule.get(moduleId)!;
    const actionLines = moduleEntries.flatMap((c) => {
      const upsert = actionName("upsert", c.name);
      const del = actionName("delete", c.name);
      const valueType = `T${c.exportName}Do`;
      return [
        `    ${upsert}: ActionDefinition<${valueType}>;`,
        `    ${del}: ActionDefinition<string>;`,
      ];
    });
    return [`  "${moduleId}": {`, ...actionLines, "  };"];
  });

  const sharedTypeImports = ["TDoModuleId", ...sharedTypeNames];

  return [
    'import { BasicIndex } from "@tanstack/react-db";',
    "import {",
    "  createDeleteStreamAction,",
    "  createDoStreamDB,",
    "  createUpsertStreamAction,",
    '} from "@monrep/db/collections";',
    'import { DO_MODULE_LIVE, DO_MODULE_STATE, DO_MODULES } from "./do.gen";',
    'import type { ActionDefinition } from "@durable-streams/state/db";',
    'import type { CreateDoModuleDbOpts } from "@monrep/db/collections";',
    `import type {\n\t${sharedTypeImports.join(",\n\t")}\n} from "./types.gen";`,
    "",
    ...factoryBlocks,
    "const DO_MODULE_DB_FACTORY_IMPL = {",
    ...moduleIds.map((moduleId) => `  "${moduleId}": create${pascal(moduleId)}StreamDB,`),
    "}",
    "",
    "export const DO_MODULE_DB_FACTORIES: {",
    "  [TModule in TDoModuleId]: (opts: CreateDoModuleDbOpts) => ReturnType<(typeof DO_MODULE_DB_FACTORY_IMPL)[TModule]>;",
    "} = DO_MODULE_DB_FACTORY_IMPL;",
    "",
    "export type TDoModuleActionDefinitions = {",
    ...actionDefinitionBlocks,
    "};",
  ].join("\n");
}

export async function runDbCollectionsDo(): Promise<void> {
  const names = (await readdir(paths.doDir, { withFileTypes: true }))
    .filter((e) => e.isFile() && isDoModule(e.name))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  const collectionEntries: Array<CollectionEntry> = [];
  for (const n of names) {
    const base = path.basename(n, ".ts");
    const source = await Bun.file(path.join(paths.doDir, n)).text();
    const parsed = parseDoModuleSource(source, base);
    if (!parsed) continue;
    for (const c of parsed.collections) {
      collectionEntries.push({
        name: c.name,
        exportName: pascal(c.name),
        streamModule: parsed.moduleId,
        primaryKey: c.primaryKey,
        indexes: [...c.indexes],
      });
    }
  }
  collectionEntries.sort((a, b) => a.name.localeCompare(b.name));

  await writeIfChanged(
    paths.collectionsGen,
    `${buildDbCollectionsDoSource(collectionEntries).trimEnd()}\n`,
    "dbCollectionsDo",
  );
}
