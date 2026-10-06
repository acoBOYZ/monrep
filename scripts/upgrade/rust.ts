#!/usr/bin/env bun
/// <reference types="bun" />

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { isGitmodulePath, readGitmodules } from "../utils/gitmodules";
import { exitIfCi } from "../utils/is-ci";
import { findFiles } from "../utils/walk";

exitIfCi("\nCI detected — skipping Rust toolchain / wrap crate upgrade\n");

const ROOT = process.cwd();
const SUBMODULES = readGitmodules(join(ROOT, ".gitmodules"));
const COMPONENTS = ["rustfmt", "clippy", "rust-analyzer", "rust-src"] as const;

async function run(cmd: Array<string>, cwd: string) {
  const proc = Bun.spawn({
    cmd,
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await proc.exited;
  if (code !== 0) process.exit(code);
}

async function capture(cmd: Array<string>, cwd: string, allowFail = false): Promise<string> {
  const proc = Bun.spawn({
    cmd,
    cwd,
    stdout: "pipe",
    stderr: allowFail ? "pipe" : "inherit",
  });
  const text = await new Response(proc.stdout).text();
  const code = await proc.exited;
  if (code !== 0 && !allowFail) process.exit(code);
  return text.trim();
}

function hasRustup(): boolean {
  const proc = Bun.spawnSync({
    cmd: ["rustup", "--version"],
    stdout: "pipe",
    stderr: "pipe",
  });
  return proc.exitCode === 0;
}

async function findCargoTomls(dir: string) {
  return findFiles(dir, (name) => name === "Cargo.toml", {
    skipDirs: ["miri"],
    ignore: ({ rel, isDirectory }) => isDirectory && isGitmodulePath(rel, SUBMODULES),
  });
}

async function hashManifest(cwd: string) {
  const toml = await readFile(join(cwd, "Cargo.toml"), "utf8");
  const lockPath = join(cwd, "Cargo.lock");
  const lock = existsSync(lockPath) ? await readFile(lockPath, "utf8") : "";
  return `${toml}\n${lock}`;
}

async function ensureCargoEdit() {
  const proc = Bun.spawnSync({
    cmd: ["cargo", "upgrade", "--help"],
    cwd: ROOT,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (proc.exitCode === 0) return;
  console.log("  installing cargo-edit (cargo upgrade)…\n");
  await run(["cargo", "install", "cargo-edit", "--locked"], ROOT);
}

console.log("\n🔄 Updating Rust toolchain + wrap crates…\n");

if (!hasRustup()) {
  console.error("rustup is required. Install: https://rustup.rs\n");
  process.exit(1);
}

await run(["rustup", "self", "update"], ROOT);
// await run(["rustup", "update", "stable"], ROOT);
await run(["rustup", "update"], ROOT);
await run(["rustup", "component", "add", ...COMPONENTS], ROOT);

const rustc = await capture(["rustc", "--version"], ROOT);
console.log(`  rustc ${rustc}\n`);

await ensureCargoEdit();

const manifests = await findCargoTomls(ROOT);
if (manifests.length === 0) {
  console.log("  ✓ no wrap Cargo.toml (submodules skipped)\n");
  console.log("✅ Rust toolchain updated\n");
  process.exit(0);
}

for (const manifest of manifests) {
  const cwd = dirname(manifest);
  console.log(`→ ${relative(ROOT, cwd)}`);

  const before = await hashManifest(cwd);
  await run(["cargo", "upgrade", "--incompatible", "--pinned"], cwd);
  await run(["cargo", "update"], cwd);
  // await run(["cargo", "tree", "-p", "whatsapp-rust", "--depth", "1"], cwd);
  const after = await hashManifest(cwd);

  if (before === after) {
    console.log("  ✓ Cargo.toml / Cargo.lock unchanged\n");
  } else {
    console.log("  ↑ wrap crate dependencies refreshed\n");
  }
}

console.log("✅ Rust toolchain + wrap crates updated\n");
