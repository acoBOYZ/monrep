#!/usr/bin/env bun
/// <reference types="bun" />

import { runGitCliff } from "git-cliff";
import { REPO_ROOT } from "./paths";

const CHANGELOG_FILE = "CHANGELOG.md";

await runGitCliff({ bump: "auto", unreleased: true, prepend: CHANGELOG_FILE }, { cwd: REPO_ROOT });
