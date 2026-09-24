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
