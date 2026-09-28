#!/usr/bin/env bun
/// <reference types="bun" />
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const repo = resolve(import.meta.dir, "..");
const hostManifest = resolve(repo, "miri", "Cargo.toml");

function run(cmd: string, args: Array<string>, opts: Parameters<typeof spawnSync>[2] = {}) {
  return spawnSync(cmd, args, { stdio: "inherit", cwd: repo, ...opts });
}

if (!existsSync(hostManifest)) {
  console.error(`Missing ${hostManifest}`);
  process.exit(1);
}

function ensureMiri() {
  if (run("cargo", ["+nightly", "miri", "--version"], { stdio: "pipe" }).status === 0) {
    return;
  }
  console.log("\x1b[36m[setup]\x1b[0m rustup toolchain install nightly --component miri");
  if (
    run("rustup", ["toolchain", "install", "nightly", "--component", "miri"]).status !== 0 ||
    run("cargo", ["+nightly", "miri", "setup"]).status !== 0
  ) {
    process.exit(1);
  }
}

ensureMiri();
const args = [
  "+nightly",
  "miri",
  "test",
  "--locked",
  "--manifest-path",
  hostManifest,
  ...process.argv.slice(2),
];
console.log(`\x1b[36m[miri]\x1b[0m cargo ${args.join(" ")}`);
process.exit(run("cargo", args).status ?? 1);
