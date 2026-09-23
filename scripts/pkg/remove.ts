#!/usr/bin/env bun
/// <reference types="bun" />

const [, , workspace, ...deps] = process.argv;

if (!workspace || deps.length === 0) {
  console.error("Usage: bun removeto <workspace> <deps...>");
  process.exit(1);
}

const cmd = ["bun", "remove", ...deps, "--cwd", workspace];

const proc = Bun.spawn({
  cmd,
  stdout: "inherit",
  stderr: "inherit",
});

void proc.exited;
