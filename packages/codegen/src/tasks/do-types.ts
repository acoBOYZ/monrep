import { readdir } from "node:fs/promises";
import path from "node:path";
import { writeIfChanged } from "../lib/emit";
import { pascal } from "../lib/naming";
import { parseDoModuleSource } from "../lib/parse-do-module";
import { paths } from "../paths";

const IGNORE = new Set(["index.ts", "index.gen.ts", "create-do-module.gen.ts"]);

const isDoModule = (name: string) =>
  name.endsWith(".ts") && !name.endsWith(".d.ts") && !IGNORE.has(name) && !name.endsWith(".gen.ts");

export async function runDoTypes(): Promise<void> {
  const names = (await readdir(paths.dbDoDir, { withFileTypes: true }))
    .filter((e) => e.isFile() && isDoModule(e.name))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  const collections: Array<{ name: string; exportName: string }> = [];
  for (const n of names) {
    const base = path.basename(n, ".ts");
    const source = await Bun.file(path.join(paths.dbDoDir, n)).text();
    const parsed = parseDoModuleSource(source, base);
    if (!parsed) continue;
    for (const c of parsed.collections) {
      collections.push({ name: c.name, exportName: pascal(c.name) });
    }
  }
  collections.sort((a, b) => a.name.localeCompare(b.name));

  const schemaImports = collections.map((r) => `${r.exportName}DoSchema`);
  const lines = [
    'import type { z } from "zod";',
    ...(schemaImports.length > 0
      ? [`import type {\n\tTDoModuleId,\n\t${schemaImports.join(",\n\t")},\n} from "../do";`]
      : ['import type { TDoModuleId } from "../do";']),
    "",
    "export type { TDoModuleId };",
    "",
    ...collections.flatMap((r) => [
      `export type T${r.exportName}Do = z.infer<typeof ${r.exportName}DoSchema>;`,
      "",
    ]),
  ];

  await writeIfChanged(paths.dbTypesIndexGen, `${lines.join("\n").trimEnd()}\n`, "doTypes");
}
