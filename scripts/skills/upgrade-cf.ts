#!/usr/bin/env bun
/// <reference types="bun" />

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DEST_ROOT = join(ROOT, "packages/agent-skills/skills");
const UPSTREAM = "https://github.com/cloudflare/skills.git";
const SKILL_LINE_LIMIT = 500;

const ALLOWLIST = [
  "cloudflare",
  "wrangler",
  "workers-best-practices",
  "durable-objects",
  "agents-sdk",
  "sandbox-sdk",
  "cloudflare-email-service",
  "web-perf",
] as const;

type SkillName = (typeof ALLOWLIST)[number];

const LAZY_NOTE =
  "After this skill loads, read **one** `references/<product>/` file if needed. Never dump the `references/` tree into context.";

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
    console.error("usage: bun scripts/skills/upgrade-cf.ts [--from <dir>]");
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

function ensureCloudflareLazyNote(body: string): string {
  if (body.includes("Never dump the `references/`")) return body;
  return body.replace(/^(?:\n)*(# .+\n\n)/, `$1${LAZY_NOTE}\n\n`);
}

function rewriteFrontmatter(content: string, name: string, version: string): string {
  const { fields, body } = parseFrontmatter(content);
  const nameLine = fields.get("name") ?? `name: ${name}`;
  const description = fields.get("description");
  if (!description) throw new Error(`${name}: missing description`);

  const parts = ["---", nameLine, description];
  const license = fields.get("license");
  if (license) parts.push(license);
  const compatibility = fields.get("compatibility");
  if (compatibility) parts.push(compatibility);
  parts.push(
    "metadata:",
    "  type: core",
    "  library: cloudflare",
    `  library_version: '${version}'`,
  );
  const allowedTools = fields.get("allowed-tools");
  if (allowedTools) parts.push(allowedTools);
  parts.push("sources:", `  - 'cloudflare/skills:skills/${name}/SKILL.md'`, "---", "");

  const nextBody = name === "cloudflare" ? ensureCloudflareLazyNote(body) : body;
  return `${parts.join("\n")}${nextBody.replace(/^\n+/, "")}`;
}

function splitWranglerIfNeeded(destDir: string, content: string): string {
  if (content.split("\n").length <= SKILL_LINE_LIMIT) return content;

  const end = content.indexOf("\n---\n");
  if (end < 0) return content;
  const fm = content.slice(0, end + 5);
  const body = content.slice(end + 5);
  const sep = "\n---\n";
  const idx = body.indexOf(sep);
  const head = (
    idx >= 0 ? body.slice(0, idx) : body.split("\n").slice(0, 120).join("\n")
  ).trimEnd();
  const rest = (
    idx >= 0 ? body.slice(idx + sep.length) : body.split("\n").slice(120).join("\n")
  ).trimStart();

  mkdirSync(join(destDir, "references"), { recursive: true });
  writeFileSync(join(destDir, "references/cli.md"), `# Wrangler CLI reference\n\n${rest}\n`);

  return `${fm}${head}\n\nFurther CLI, config, bindings, and flags: read \`references/cli.md\` only if the command is not in the table above.\n`;
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
  let next = rewriteFrontmatter(readFileSync(skillFile, "utf8"), name, version);
  if (name === "wrangler") next = splitWranglerIfNeeded(dest, next);
  writeFileSync(skillFile, next);
  const lines = next.split("\n").length;
  if (lines > SKILL_LINE_LIMIT) {
    throw new Error(`${name}/SKILL.md is ${lines} lines (limit ${SKILL_LINE_LIMIT})`);
  }
}

function cloneUpstream(): { root: string; sha: string; cleanup: () => void } {
  const dir = join(ROOT, ".tmp/cf-skills");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(ROOT, ".tmp"), { recursive: true });
  capture(["git", "clone", "--depth", "1", UPSTREAM, dir], ROOT);
  const sha = capture(["git", "rev-parse", "--short", "HEAD"], dir);
  return {
    root: dir,
    sha,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

function main() {
  const from = parseFromArg();
  let srcRoot: string;
  let version: string;
  let cleanup: (() => void) | undefined;

  if (from) {
    if (!existsSync(from)) {
      console.error(`--from not found: ${from}`);
      process.exit(1);
    }
    srcRoot = from;
    version = "cursor-local";
  } else {
    const cloned = cloneUpstream();
    srcRoot = cloned.root;
    version = cloned.sha;
    cleanup = cloned.cleanup;
  }

  try {
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
  } finally {
    cleanup?.();
  }
}

main();
