import { readdir } from "node:fs/promises";
import path from "node:path";
import { writeIfChanged } from "../lib/emit";
import { pascal } from "../lib/naming";
import { parseDoModuleSource } from "../lib/parse-do-module";
import { paths } from "../paths";

const IGNORE = new Set(["index.ts", "index.gen.ts", "create-do-module.gen.ts"]);

const isDoModule = (name: string) =>
  name.endsWith(".ts") && !name.endsWith(".d.ts") && !IGNORE.has(name) && !name.endsWith(".gen.ts");

type CollectionEntry = {
  name: string;
  exportName: string;
  streamModule: string;
  primaryKey: string;
};

const actionName = (op: "upsert" | "delete", collectionName: string): string =>
  `${op}${pascal(collectionName)}`;

const collectionOptionsExportName = (moduleId: string, collectionName: string): string =>
  `${moduleId}${pascal(collectionName)}Collection`;

export function buildDbCollectionsDoSource(entries: Array<CollectionEntry>): string {
  const byModule = new Map<string, Array<CollectionEntry>>();
  for (const entry of entries) {
    const list = byModule.get(entry.streamModule) ?? [];
    list.push(entry);
    byModule.set(entry.streamModule, list);
  }

  const moduleIds = [...byModule.keys()].sort((a, b) => a.localeCompare(b));
  const sharedTypeNames = entries.map((c) => `T${c.exportName}Do`);

  const collectionOptionBlocks = entries.flatMap((c) => {
    const exportName = collectionOptionsExportName(c.streamModule, c.name);
    return [`export const ${exportName} = doCollection("${c.streamModule}", "${c.name}");`];
  });

  const doCollectionOptionsMap = [
    "export const DO_COLLECTION_OPTIONS = {",
    ...moduleIds.flatMap((moduleId) => {
      const moduleEntries = byModule.get(moduleId)!;
      return [
        `  "${moduleId}": {`,
        ...moduleEntries.map(
          (c) => `    ${c.name}: ${collectionOptionsExportName(moduleId, c.name)},`,
        ),
        "  },",
      ];
    }),
    "} as const;",
  ];

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
    return [
      `const create${pascal(moduleId)}StreamDB = (opts: CreateDoModuleDbOpts) =>`,
      `  createDoStreamDB("${moduleId}", opts, ({ db, state }) => ({`,
      ...actionLines,
      "  }));",
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

  const collectionExportNames = entries.map((c) =>
    collectionOptionsExportName(c.streamModule, c.name),
  );

  const materializeCases = entries.map((c) => {
    const exportName = collectionOptionsExportName(c.streamModule, c.name);
    return `    case ${exportName}.id: return materializeDoOne(dbClient, ${exportName}, ensure, "${c.streamModule}", (db) => db.collections.${c.name});`;
  });

  const anyDoCollectionOptionsType =
    collectionExportNames.length === 0
      ? "export type AnyDoCollectionOptions = never;"
      : `export type AnyDoCollectionOptions =\n${collectionExportNames.map((n) => `  | typeof ${n}`).join("\n")};`;

  return [
    'import { doCollection } from "./stream/doCollection";',
    'import { createDoStreamDB } from "./stream/createDoStreamDB";',
    'import { materializeDoOne } from "./stream/materializeDoOne";',
    'import { createDeleteStreamAction, createUpsertStreamAction } from "./stream/streamActionHelpers";',
    'import { DO_MODULES } from "../do";',
    'import type { ActionDefinition } from "@durable-streams/state/db";',
    'import type { DbClient } from "@tanstack/react-db";',
    `import type {\n\t${sharedTypeImports.join(",\n\t")}\n} from "../types";`,
    'import type { CreateDoModuleDbOpts, DoStreamDb } from "./stream/types";',
    "",
    ...collectionOptionBlocks,
    "",
    ...factoryBlocks,
    "const DO_MODULE_DB_FACTORY_IMPL = {",
    ...moduleIds.map((moduleId) => `  "${moduleId}": create${pascal(moduleId)}StreamDB,`),
    "} as const satisfies { [TModule in TDoModuleId]: (opts: CreateDoModuleDbOpts) => unknown; };",
    "",
    "export const DO_MODULE_DB_FACTORIES: {",
    "  [TModule in TDoModuleId]: (opts: CreateDoModuleDbOpts) => ReturnType<(typeof DO_MODULE_DB_FACTORY_IMPL)[TModule]>;",
    "} = DO_MODULE_DB_FACTORY_IMPL;",
    "",
    "export async function materializeDoCollection(",
    "  dbClient: DbClient,",
    "  options: AnyDoCollectionOptions,",
    "  ensure: <TModule extends TDoModuleId>(moduleId: TModule) => Promise<DoStreamDb<TModule>>,",
    "): Promise<void> {",
    "  switch (options.id) {",
    ...materializeCases,
    "  }",
    "}",
    "",
    ...doCollectionOptionsMap,
    "",
    "export type TDoCollectionOptions = typeof DO_COLLECTION_OPTIONS;",
    "",
    anyDoCollectionOptionsType,
    "",
    "export type TDoModuleActionDefinitions = {",
    ...actionDefinitionBlocks,
    "};",
  ].join("\n");
}

export async function runDbCollectionsDo(): Promise<void> {
  const names = (await readdir(paths.dbDoDir, { withFileTypes: true }))
    .filter((e) => e.isFile() && isDoModule(e.name))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  const collectionEntries: Array<CollectionEntry> = [];
  for (const n of names) {
    const base = path.basename(n, ".ts");
    const source = await Bun.file(path.join(paths.dbDoDir, n)).text();
    const parsed = parseDoModuleSource(source, base);
    if (!parsed) continue;
    for (const c of parsed.collections) {
      collectionEntries.push({
        name: c.name,
        exportName: pascal(c.name),
        streamModule: parsed.moduleId,
        primaryKey: c.primaryKey,
      });
    }
  }
  collectionEntries.sort((a, b) => a.name.localeCompare(b.name));

  await writeIfChanged(
    paths.dbCollectionsDoGen,
    `${buildDbCollectionsDoSource(collectionEntries).trimEnd()}\n`,
    "dbCollectionsDo",
  );
}
