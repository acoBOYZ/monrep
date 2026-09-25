#!/usr/bin/env bun
/// <reference types="bun" />

import { runGitCliff } from "git-cliff";
import { ensureGithubToken } from "./github-token";
import { writeOutput } from "./output";
import { REPO_ROOT } from "./paths";

ensureGithubToken();

const { stdout } = await runGitCliff(
  { latest: true, strip: "header" },
  { cwd: REPO_ROOT, stdio: ["ignore", "pipe", "ignore"] },
);
let notes = String(stdout).trimEnd();
if (!notes) {
  const tag = process.env.TAG_NAME ?? "this release";
  notes = `## ${tag}\n\nNo conventional commits found for this range.`;
}

writeOutput({ envVar: "RELEASE_NOTES_FILE", content: `${notes}\n` });
