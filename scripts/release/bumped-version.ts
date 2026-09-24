#!/usr/bin/env bun
/// <reference types="bun" />

import { runGitCliff } from "git-cliff";
import { writeOutput } from "./output";
import { REPO_ROOT } from "./paths";

const { stdout } = await runGitCliff(
  { bumpedVersion: true },
  { cwd: REPO_ROOT, stdio: ["ignore", "pipe", "ignore"] },
);
const version = String(stdout).trim().replace(/^v/, "");

writeOutput({ envVar: "BUMPED_VERSION_FILE", content: version });
