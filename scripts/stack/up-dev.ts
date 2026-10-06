#!/usr/bin/env bun
/// <reference types="bun" />

import { existsSync } from "node:fs";
import path from "node:path";
import { exitIfCi } from "../utils/is-ci";
import { run } from "../utils/run";

exitIfCi("CI detected, skipping update.");

const agentSkillsDir = path.join(process.cwd(), "packages/agent-skills/skills");

// bun upgrade
run(["bun", "upgrade", "--stable"]);

// npm deps update
run(["bunx", "--bun", "npm-check-updates", "-u", "--root", "--workspaces", "--format", "group"]);

run(["bun", "install"]);

run(["bun", "run", "sync:brand"]);

// TODO: Re-enable this when claudflare skills fix the type issues in their md ts/tsx files
if (existsSync(agentSkillsDir)) {
  // run(["bun", "run", "skills:check"]);
  run(["printf", "%s\n", "\x1b[31mTODO: Re-enable skills:check when claudflare skills fix the type issues in their md ts/tsx files\x1b[0m"]);
}

// rustup stable + wrap Cargo.toml / Cargo.lock (never cargo-update inside upstream/)
run(["bun", "run", "scripts/upgrade/rust.ts"]);

// Vendored submodule pins → origin/HEAD (see scripts/upgrade/upstream.ts)
if (existsSync(path.join(process.cwd(), ".git"))) {
  run(["bun", "run", "scripts/upgrade/upstream.ts"]);
} else {
  console.log("No .git — skipping upstream pin upgrade.");
}
