import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = vars[key];
    if (value === undefined) throw new Error(`Missing template placeholder {{${key}}}`);
    return value;
  });
}

/** Collect relative paths of all files under `dir` (skips nothing except dirs walk). */
export function collectFiles(dir: string, relativeDir = ""): Array<string> {
  const files: Array<string> = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const rel = relativeDir ? join(relativeDir, entry.name) : entry.name;
    if (entry.isDirectory()) {
      files.push(...collectFiles(join(dir, entry.name), rel));
      continue;
    }
    files.push(rel);
  }
  return files;
}

/** Render `*.tpl` (strip suffix) and copy other files as-is into `outRoot`. */
export function scaffoldFromTemplates(
  templateDir: string,
  outRoot: string,
  vars: Record<string, string>,
): Array<string> {
  if (!existsSync(templateDir)) {
    throw new Error(`Missing template dir: ${templateDir}`);
  }
  mkdirSync(outRoot, { recursive: true });
  const written: Array<string> = [];
  for (const rel of collectFiles(templateDir)) {
    const isTpl = rel.endsWith(".tpl");
    const outRel = isTpl ? rel.replace(/\.tpl$/, "") : rel;
    const out = join(outRoot, outRel);
    mkdirSync(dirname(out), { recursive: true });
    const raw = readFileSync(join(templateDir, rel));
    if (isTpl) {
      writeFileSync(out, renderTemplate(raw.toString("utf8"), vars));
    } else {
      writeFileSync(out, raw);
    }
    written.push(out);
  }
  return written;
}
