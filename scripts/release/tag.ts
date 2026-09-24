#!/usr/bin/env bun
/// <reference types="bun" />

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { run } from "../utils/run";
import { REPO_ROOT } from "./paths";

const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as {
  version?: string;
};
const version = String(pkg.version ?? "").replace(/^v/, "");
if (!version) {
  throw new Error("package.json is missing a version");
}

const tag = `v${version}`;

const existing = Bun.spawnSync({
  cmd: ["git", "rev-parse", "-q", "--verify", `refs/tags/${tag}`],
  cwd: REPO_ROOT,
  stdout: "ignore",
  stderr: "ignore",
});
if (existing.exitCode === 0) {
  throw new Error(`tag ${tag} already exists`);
}

run(["git", "tag", "-a", tag, "-m", `chore(release): ${tag}`], { cwd: REPO_ROOT });
run(["git", "push", "origin", tag], { cwd: REPO_ROOT });

console.log(`Pushed ${tag}`);
