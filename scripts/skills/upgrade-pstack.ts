#!/usr/bin/env bun
/// <reference types="bun" />

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DEST_ROOT = join(ROOT, "packages/agent-skills/skills");
const TMP_DIR = join(ROOT, ".tmp/pstack");
const TARBALL_URL = "https://codeload.github.com/backnotprop/pstack/tar.gz/HEAD";
const COMMITS_URL = "https://api.github.com/repos/backnotprop/pstack/commits/HEAD";
const SKILL_LINE_LIMIT = 500;
const SOURCE_PREFIX = "backnotprop/pstack:skills";

const ALLOWLIST = [
  "how",
  "blast-radius",
  "no-comments",
  "unslop",
  "typescript-best-practices",
  "principle-laziness-protocol",
  "principle-fix-root-causes",
  "principle-subtract-before-you-add",
  "principle-prove-it-works",
  "principle-type-system-discipline",
  "principle-boundary-discipline",
  "principle-minimize-reader-load",
] as const;

type SkillName = (typeof ALLOWLIST)[number];

const KEEP_BEFORE_META = ["license", "compatibility", "disable-model-invocation", "paths"] as const;

function capture(cmd: Array<string>, cwd: string): string {
  const proc = Bun.spawnSync({
    cmd,
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (proc.exitCode !== 0) {
    const err = proc.stderr.toString().trim();
    throw new Error(`${cmd.join(" ")} failed${err ? `: ${err}` : ""}`);
  }
  return proc.stdout.toString().trim();
}

function parseFromArg(): string | undefined {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--from");
  if (idx < 0) return undefined;
  const value = args[idx + 1];
  if (!value || value.startsWith("-")) {
    console.error("usage: bun scripts/skills/upgrade-pstack.ts [--from <dir>]");
    process.exit(1);
  }
  return value;
}

function resolveSkillSrc(root: string, name: string): string | null {
  const nested = join(root, "skills", name);
  const flat = join(root, name);
  if (existsSync(join(nested, "SKILL.md"))) return nested;
  if (existsSync(join(flat, "SKILL.md"))) return flat;
  return null;
}

function parseFrontmatter(content: string): { fields: Map<string, string>; body: string } {
  if (!content.startsWith("---\n")) {
    throw new Error("SKILL.md missing YAML frontmatter");
  }
  const end = content.indexOf("\n---\n", 4);
  if (end < 0) throw new Error("SKILL.md frontmatter not closed");
  const raw = content.slice(4, end);
  const body = content.slice(end + 5);
  const fields = new Map<string, string>();
  const lines = raw.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) {
      i += 1;
      continue;
    }
    const key = match[1] ?? "";
    const rest = match[2] ?? "";
    const block = rest === "" || rest === ">" || rest === "|";
    if (!block) {
      fields.set(key, line);
      i += 1;
      continue;
    }
    const collected = [line];
    i += 1;
    while (i < lines.length) {
      const next = lines[i] ?? "";
      if (/^[A-Za-z0-9_-]+:/.test(next)) break;
      collected.push(next);
      i += 1;
    }
    fields.set(key, collected.join("\n").trimEnd());
  }
  return { fields, body };
}

function rewriteFrontmatter(content: string, name: string, version: string): string {
  const { fields, body } = parseFrontmatter(content);
  const nameLine = fields.get("name") ?? `name: ${name}`;
  const description = fields.get("description");
  if (!description) throw new Error(`${name}: missing description`);

  const parts = ["---", nameLine, description];
  for (const key of KEEP_BEFORE_META) {
    const field = fields.get(key);
    if (field) parts.push(field);
  }
  parts.push("metadata:", "  type: core", "  library: pstack", `  library_version: '${version}'`);
  const allowedTools = fields.get("allowed-tools");
  if (allowedTools) parts.push(allowedTools);
  parts.push("sources:", `  - '${SOURCE_PREFIX}/${name}/SKILL.md'`, "---", "");
  return `${parts.join("\n")}${body.replace(/^\n+/, "")}`;
}

function copySkill(src: string, dest: string) {
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, {
    recursive: true,
    filter: (path) => !path.endsWith(".DS_Store") && !path.includes("/.git"),
  });
}

function vendorSkill(name: SkillName, src: string, version: string) {
  const dest = join(DEST_ROOT, name);
  copySkill(src, dest);
  const skillFile = join(dest, "SKILL.md");
  const next = rewriteFrontmatter(readFileSync(skillFile, "utf8"), name, version);
  writeFileSync(skillFile, next);
  const lines = next.split("\n").length;
  if (lines > SKILL_LINE_LIMIT) {
    throw new Error(`${name}/SKILL.md is ${lines} lines (limit ${SKILL_LINE_LIMIT})`);
  }
}

function findSrcRoot(extract: string): string {
  if (existsSync(join(extract, "skills"))) return extract;
  for (const entry of readdirSync(extract, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const candidate = join(extract, entry.name);
    if (existsSync(join(candidate, "skills"))) return candidate;
  }
  throw new Error(`tarball missing skills/ under ${extract}`);
}

async function fetchUpstream(): Promise<{ root: string; sha: string }> {
  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(TMP_DIR, { recursive: true });

  const headers = { "User-Agent": "agent-skills-upgrade" };
  const metaRes = await fetch(COMMITS_URL, { headers });
  if (!metaRes.ok) throw new Error(`commits/HEAD failed: ${metaRes.status}`);
  const meta = (await metaRes.json()) as { sha?: string };
  const sha = meta.sha?.slice(0, 7);
  if (!sha) throw new Error("commits/HEAD missing sha");

  const tarRes = await fetch(TARBALL_URL, { headers });
  if (!tarRes.ok) throw new Error(`tarball failed: ${tarRes.status}`);
  const tarball = join(TMP_DIR, "pstack.tar.gz");
  await Bun.write(tarball, tarRes);
  const extract = join(TMP_DIR, "src");
  mkdirSync(extract, { recursive: true });
  capture(["tar", "-xzf", tarball, "-C", extract], ROOT);
  return { root: findSrcRoot(extract), sha };
}

async function main() {
  const from = parseFromArg();
  let srcRoot: string;
  let version: string;

  if (from) {
    if (!existsSync(from)) {
      console.error(`--from not found: ${from}`);
      process.exit(1);
    }
    srcRoot = from;
    version = "local";
  } else {
    const fetched = await fetchUpstream();
    srcRoot = fetched.root;
    version = fetched.sha;
  }

  mkdirSync(DEST_ROOT, { recursive: true });
  for (const name of ALLOWLIST) {
    const src = resolveSkillSrc(srcRoot, name);
    if (!src) {
      const dest = join(DEST_ROOT, name);
      if (existsSync(join(dest, "SKILL.md"))) {
        console.warn(`skip ${name}: missing upstream, left existing folder`);
      } else {
        console.warn(`skip ${name}: missing upstream and no existing folder`);
      }
      continue;
    }
    vendorSkill(name, src, version);
    console.log(`vendored ${name} → ${version}`);
  }

  if (!from) rmSync(TMP_DIR, { recursive: true, force: true });
}

await main();
