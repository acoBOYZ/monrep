#!/usr/bin/env bun
/// <reference types="bun" />

import { readdirSync } from "node:fs";
import { join } from "node:path";
import { scaffoldFromTemplates } from "./template-render";

const ROOT = join(import.meta.dirname, "../..");
const PACKAGES_DIR = join(ROOT, "packages");
const TEMPLATE_DIR = join(PACKAGES_DIR, ".templates/app");

const NAME_RE = /^[a-z][a-z0-9-]*$/;

const RESERVED = new Set([
  ".templates",
  "agent-skills",
  "codegen",
  "db",
  "effect-solutions",
  "hooks",
  "main",
  "ui",
  "utils",
]);

const parseName = (arg: string | undefined): string => {
  if (arg === undefined || arg.length === 0 || arg.startsWith("-")) {
    console.error("Usage: bun run create:app <name>");
    console.error("  name: lowercase kebab-case (e.g. playground, demo-app)");
    process.exit(1);
  }
  if (!NAME_RE.test(arg)) {
    console.error(`Invalid name "${arg}". Use /^[a-z][a-z0-9-]*$/`);
    process.exit(1);
  }
  return arg;
};

const name = parseName(process.argv[2]);

const existing = new Set(
  readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name),
);

if (RESERVED.has(name) || existing.has(name)) {
  console.error(`Package name "${name}" is reserved or already exists under packages/`);
  process.exit(1);
}

const outRoot = join(PACKAGES_DIR, name);
const vars: Record<string, string> = {
  name,
  package: `@monrep/${name}`,
  dev_port: "5280",
};

console.log(`Scaffolding ${vars.package} → packages/${name}`);
const written = scaffoldFromTemplates(TEMPLATE_DIR, outRoot, vars);
for (const path of written) {
  console.log(`  + ${path.slice(ROOT.length + 1)}`);
}

const run = async (cmd: Array<string>, label: string) => {
  console.log(`\n→ ${label}`);
  const proc = Bun.spawn({
    cmd,
    cwd: ROOT,
    stdout: "inherit",
    stderr: "inherit",
    env: process.env,
  });
  const code = await proc.exited;
  if (code !== 0) {
    console.error(`Failed: ${label} (exit ${code})`);
    process.exit(code);
  }
};

await run(["bun", "install"], "bun install");
await run(["bun", "run", "codegen", "--", "--package", name], `codegen --package ${name}`);
await run(["bun", "run", "--cwd", `packages/${name}`, "generate-routes"], "generate-routes (tsr)");
await run(["bun", "run", "--cwd", `packages/${name}`, "cf-typegen"], "wrangler types");

console.log(`
Done. Next:

  cp packages/${name}/.dev.vars.example packages/${name}/.dev.vars
  bun run --cwd packages/${name} dev

Login: /login  ·  Playground: /playground/streams
`);
