#!/usr/bin/env bun
/// <reference types="bun" />

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "./paths";

const version = Bun.argv[2];
if (!version) {
  throw new Error("usage: bun scripts/release/set-version.ts <version>");
}

type RootPackageJson = {
  version: string;
  [key: string]: unknown;
};

const PACKAGE_JSON_PATH = join(REPO_ROOT, "package.json");
const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8")) as RootPackageJson;
pkg.version = version;
writeFileSync(PACKAGE_JSON_PATH, `${JSON.stringify(pkg, null, 2)}\n`);

const CARGO_TOML_PATH = join(REPO_ROOT, "packages/agent/Cargo.toml");
const cargo = readFileSync(CARGO_TOML_PATH, "utf8");
const nextCargo = cargo.replace(
  /^(\[package\][\s\S]*?^version\s*=\s*")[^"]*(")/m,
  `$1${version}$2`,
);
if (nextCargo === cargo && !cargo.includes(`version = "${version}"`)) {
  throw new Error(`could not update version in ${CARGO_TOML_PATH}`);
}
writeFileSync(CARGO_TOML_PATH, nextCargo);

console.log(`set version ${version} (package.json + packages/agent/Cargo.toml)`);
