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
  type: string;
  primaryKey: string;
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
  const sharedSchemaNames = entries.map((c) => `${c.exportName}DoSchema`);
  const sharedTypeNames = entries.map((c) => `T${c.exportName}Do`);

  const dbFactoryBlocks = moduleIds.flatMap((moduleId) => {
    const moduleEntries = byModule.get(moduleId)!;
    const pascalName = pascal(moduleId);
    const schemaLines = moduleEntries.map(
      (c) =>
        `    ${c.name}: { schema: ${c.exportName}DoSchema, type: "${c.type}", primaryKey: "${c.primaryKey}" },`,
    );
    const actionLines = moduleEntries.flatMap((c) => {
      const upsert = actionName("upsert", c.name);
      const del = actionName("delete", c.name);
      const valueType = `T${c.exportName}Do`;
      return [
        `      ${upsert}: createUpsertStreamAction<${valueType}>({ db, helpers: state.${c.name}, collection: db.collections.${c.name}, primaryKey: "${c.primaryKey}" }),`,
        `      ${del}: createDeleteStreamAction<${valueType}>({ db, helpers: state.${c.name}, collection: db.collections.${c.name} }),`,
      ];
    });

    return [
      `/** Concrete StreamDB factory for module \`${moduleId}\`. */`,
      `const create${pascalName}StreamDB = (opts: CreateDoModuleDbOpts) => {`,
      "  const state = createStateSchema({",
      ...schemaLines,
      "  });",
      "  return createStreamDB({",
      "    stream: opts.stream,",
      "    onBatch: opts.onBatch,",
      "    onBeforeBatch: opts.onBeforeBatch,",
      "    state,",
      "    actions: ({ db }) => ({",
      ...actionLines,
      "    }),",
      `    live: opts.live ?? DO_MODULE_LIVE["${moduleId}"],`,
      "  });",
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
  const sharedValueImports = [
    ...(moduleIds.length > 0 ? ["DO_MODULE_LIVE"] : []),
    ...sharedSchemaNames,
  ];

  return [
    ...(sharedValueImports.length > 0
      ? [`import {\n\t${sharedValueImports.join(",\n\t")}\n} from "../do";`]
      : []),
    ...(moduleIds.length > 0
      ? ['import { createStateSchema, createStreamDB } from "@durable-streams/state/db";']
      : []),
    'import { createDeleteStreamAction, createUpsertStreamAction } from "./stream/streamActionHelpers";',
    'import type { ActionDefinition } from "@durable-streams/state/db";',
    `import type {\n\t${sharedTypeImports.join(",\n\t")}\n} from "../types";`,
    'import type { CreateDoModuleDbOpts } from "./stream/types";',
    "",
    ...dbFactoryBlocks,
    "export type TDoModuleActionDefinitions = {",
    ...actionDefinitionBlocks,
    "};",
    "",
    "const DO_MODULE_DB_FACTORY_IMPL = {",
    ...moduleIds.map((moduleId) => `  "${moduleId}": create${pascal(moduleId)}StreamDB,`),
    "} as const satisfies { [TModule in TDoModuleId]: (opts: CreateDoModuleDbOpts) => unknown; };",
    "",
    "export const DO_MODULE_DB_FACTORIES: {",
    "  [TModule in TDoModuleId]: (opts: CreateDoModuleDbOpts) => ReturnType<(typeof DO_MODULE_DB_FACTORY_IMPL)[TModule]>;",
    "} = DO_MODULE_DB_FACTORY_IMPL;",
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
        type: c.type,
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
