#!/usr/bin/env bun
/// <reference types="bun" />

const [, , workspace, ...args] = process.argv;

if (!workspace || args.length === 0) {
  console.error("Usage: bun addto <workspace> <deps...> [--dev]");
  process.exit(1);
}

const isDev = args.includes("-d") || args.includes("-D") || args.includes("--dev");

const deps = args.filter((arg) => arg !== "--dev" && arg !== "-D");

if (deps.length === 0) {
  console.error("No dependencies provided");
  process.exit(1);
}

const cmd = ["bun", "add", ...deps, isDev ? "--dev" : "", "--cwd", workspace].filter(Boolean);

const proc = Bun.spawn({
  cmd,
  stdout: "inherit",
  stderr: "inherit",
});

void proc.exited;
