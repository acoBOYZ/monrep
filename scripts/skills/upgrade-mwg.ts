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
const NPM_SPEC = "modern-web-guidance@latest";
const SKILL_NAME = "modern-web-guidance";
const SKILL_LINE_LIMIT = 500;
const TMP_DIR = join(ROOT, ".tmp/mwg");
const SOURCE = "GoogleChrome/modern-web-guidance:skills/modern-web-guidance/SKILL.md";

const DESCRIPTION = `description: >
  Modern web platform guidance for native HTML/CSS/JS APIs (dialogs, popovers,
  view transitions, forms, accessibility, security, sanitization, implementing
  CWV platform APIs). Load when implementing or modernizing those platform
  patterns. Do not load first for ordinary React/TS UI work—use react-defaults
  first. Do not load for Core Web Vitals / Lighthouse audits (use web-perf).
  Do not load for backend, infra, or tooling.`;

const LAZY_NOTE =
  "After this skill loads, run `search` / `retrieve` for the matching use case. Never dump the `guides/` tree into context. Prefix CLI calls with `DISABLE_TELEMETRY=1`.";

const UPSTREAM_TYPES_LINE =
  "  - **Types**: Spread/cast newly shipped HTML attributes (`{...({ popover: 'hint', interestfor: id, commandfor: id, switch: '' } as any)}`, `[attr.*]`) rather than removing them or merging `@types/react`.";

const REPO_TYPES_LINE =
  "  - **Types**: This repo forbids `any` and unsafe `as` casts. Add narrow typings or a small typed helper for newly shipped HTML attributes (`popover`, `interestfor`, `commandfor`, `switch`); do not merge `@types/react` just to silence them.";

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
    console.error("usage: bun scripts/skills/upgrade-mwg.ts [--from <dir>]");
    process.exit(1);
  }
  return value;
}

function resolveSkillSrc(root: string, name: string): string | null {
  const candidates = [
    join(root, "skills", name),
    join(root, "package", "skills", name),
    join(root, name),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, "SKILL.md"))) return dir;
  }
  return null;
}

function readPackVersion(root: string): string | undefined {
  const candidates = [join(root, "package.json"), join(root, "package", "package.json")];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      const pkg = JSON.parse(readFileSync(candidate, "utf8")) as {
        name?: string;
        version?: string;
        license?: string;
      };
      if (pkg.name === SKILL_NAME && pkg.version && pkg.license) return pkg.version;
    } catch {
      // skip unreadable manifest
    }
  }
  return undefined;
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

function prefixTelemetry(body: string): string {
  return body
    .replace(
      /(?<!DISABLE_TELEMETRY=1 )npx -y modern-web-guidance@latest/g,
      "DISABLE_TELEMETRY=1 npx -y modern-web-guidance@latest",
    )
    .replace(
      /(?<!DISABLE_TELEMETRY=1 )pnpx modern-web-guidance@latest/g,
      "DISABLE_TELEMETRY=1 pnpx modern-web-guidance@latest",
    );
}

function patchBody(body: string): string {
  let next = body;
  if (!next.includes("Never dump the `guides/`")) {
    next = next.replace(/^(?:\n)*(# .+\n\n)/, `$1${LAZY_NOTE}\n\n`);
    if (!next.includes("Never dump the `guides/`")) {
      throw new Error("failed to insert lazy-load note after the skill title");
    }
  }
  if (next.includes(UPSTREAM_TYPES_LINE)) {
    next = next.replace(UPSTREAM_TYPES_LINE, REPO_TYPES_LINE);
  } else if (!next.includes(REPO_TYPES_LINE)) {
    throw new Error("upstream Types guidance changed; update the vendor patch");
  }
  next = prefixTelemetry(next);
  if (/(?<!DISABLE_TELEMETRY=1 )npx -y modern-web-guidance@latest/.test(next)) {
    throw new Error("unprefixed npx modern-web-guidance invocations remain");
  }
  if (/(?<!DISABLE_TELEMETRY=1 )pnpx modern-web-guidance@latest/.test(next)) {
    throw new Error("unprefixed pnpx modern-web-guidance invocations remain");
  }
  if (next.includes("as any")) {
    throw new Error("as any remains in SKILL.md after the vendor patch");
  }
  return next;
}

function rewriteFrontmatter(content: string, version: string): string {
  const { fields, body } = parseFrontmatter(content);
  const nameLine = fields.get("name") ?? `name: ${SKILL_NAME}`;
  const parts = ["---", nameLine, DESCRIPTION];
  const license = fields.get("license");
  if (license) parts.push(license);
  const compatibility = fields.get("compatibility");
  if (compatibility) parts.push(compatibility);
  parts.push(
    "metadata:",
    "  type: core",
    `  library: ${SKILL_NAME}`,
    `  library_version: '${version}'`,
  );
  const allowedTools = fields.get("allowed-tools");
  if (allowedTools) parts.push(allowedTools);
  parts.push("sources:", `  - '${SOURCE}'`, "---", "");
  return `${parts.join("\n")}${patchBody(body).replace(/^\n+/, "")}`;
}

function copySkill(src: string, dest: string) {
  const skillFile = join(src, "SKILL.md");
  if (!existsSync(skillFile)) throw new Error(`missing ${skillFile}`);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  writeFileSync(join(dest, "SKILL.md"), readFileSync(skillFile));
  const guides = join(src, "guides");
  if (!existsSync(guides)) throw new Error(`missing ${guides}`);
  cpSync(guides, join(dest, "guides"), {
    recursive: true,
    filter: (path) => !path.endsWith(".DS_Store") && !path.includes("/.git"),
  });
}

function vendorSkill(src: string, version: string) {
  const dest = join(DEST_ROOT, SKILL_NAME);
  copySkill(src, dest);
  const skillFile = join(dest, "SKILL.md");
  const next = rewriteFrontmatter(readFileSync(skillFile, "utf8"), version);
  writeFileSync(skillFile, next);
  const lines = next.split("\n").length;
  if (lines > SKILL_LINE_LIMIT) {
    throw new Error(`${SKILL_NAME}/SKILL.md is ${lines} lines (limit ${SKILL_LINE_LIMIT})`);
  }
}

function packUpstream(): { root: string; version: string; cleanup: () => void } {
  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(TMP_DIR, { recursive: true });
  capture(["npm", "pack", NPM_SPEC], TMP_DIR);
  const tarball = readdirSync(TMP_DIR).find((name) => name.endsWith(".tgz"));
  if (!tarball) throw new Error("npm pack produced no tarball");
  capture(["tar", "-xzf", tarball], TMP_DIR);
  const root = join(TMP_DIR, "package");
  const version = readPackVersion(root);
  if (!version) throw new Error(`could not read version from ${join(root, "package.json")}`);
  return {
    root,
    version,
    cleanup: () => rmSync(TMP_DIR, { recursive: true, force: true }),
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
    version = readPackVersion(from) ?? "local";
  } else {
    const packed = packUpstream();
    srcRoot = packed.root;
    version = packed.version;
    cleanup = packed.cleanup;
  }

  try {
    mkdirSync(DEST_ROOT, { recursive: true });
    const src = resolveSkillSrc(srcRoot, SKILL_NAME);
    if (!src) {
      throw new Error(`missing ${SKILL_NAME}/SKILL.md under ${srcRoot}`);
    }
    vendorSkill(src, version);
    console.log(`vendored ${SKILL_NAME} → ${version}`);
  } finally {
    cleanup?.();
  }
}

main();
