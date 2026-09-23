#!/usr/bin/env bun
/// <reference types="bun" />

const args = process.argv.slice(2);

const yes = args.includes("--yes") || args.includes("-y");
const baseIdx = args.indexOf("--base");
const base = baseIdx >= 0 && args[baseIdx + 1] ? (args[baseIdx + 1] ?? "main") : "main";

const protectIdx = args.indexOf("--protect");
const protectRaw =
  protectIdx >= 0 && args[protectIdx + 1] ? args[protectIdx + 1] : "main,master,develop,dev";
const protect = protectRaw
  ? new Set(
      protectRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
  : new Set();

if (args.includes("--help") || args.includes("-h")) {
  console.error(`Usage: bun run git:prune-merged-branches -- [options]
        bun scripts/git/prune-merged-branches.ts [options]

Deletes local branches already merged into <base> (default: main).

Options:
  --base <name>     Merge target branch (default: main)
  --protect <list>  Comma-separated branch names never to delete
  --yes, -y         Actually run git branch -d (default: dry-run only)

Examples:
  bun run git:prune-merged-branches
  bun run git:prune-merged-branches -- --base develop --yes
  bun scripts/git/prune-merged-branches.ts --protect main,develop,my-long-lived --yes`);
  process.exit(0);
}

function git(cmd: Array<string>, inherit = false) {
  return Bun.spawnSync({
    cmd: ["git", ...cmd],
    stdout: inherit ? "inherit" : "pipe",
    stderr: inherit ? "inherit" : "pipe",
  });
}

if (git(["rev-parse", "--is-inside-work-tree"]).exitCode !== 0) {
  console.error("Not a git repository.");
  process.exit(1);
}

git(["fetch", "origin", base]);

const baseRef = git(["show-ref", "--verify", "--quiet", `refs/heads/${base}`]);
if (baseRef.exitCode !== 0) {
  console.error(`Local branch '${base}' not found. Checkout or fetch it, or pass --base <branch>.`);
  process.exit(1);
}

const merged = git(["branch", "--merged", base, "--format=%(refname:short)"]);
if (merged.exitCode !== 0) {
  console.error(new TextDecoder().decode(merged.stderr) || "git branch failed");
  process.exit(1);
}

const current = new TextDecoder().decode(git(["branch", "--show-current"]).stdout).trim();

const branches = new TextDecoder()
  .decode(merged.stdout)
  .split("\n")
  .map((b) => b.trim())
  .filter(Boolean);

const toDelete = branches.filter((b) => b !== current && !protect.has(b) && b !== base);

if (toDelete.length === 0) {
  console.log(
    `No merged local branches to remove (base=${base}, current=${current || "(detached)"}).`,
  );
  process.exit(0);
}

if (!yes) {
  console.log(`Base: ${base} | current: ${current || "(detached)"} | dry-run\n`);
  for (const b of toDelete) {
    console.log(`Would delete: ${b}`);
  }
  console.log("\nPass --yes to run: git branch -d <each>");
  process.exit(0);
}

for (const b of toDelete) {
  const r = git(["branch", "-d", b], true);
  if (r.exitCode !== 0) {
    process.exit(r.exitCode);
  }
}

console.log(`Removed ${toDelete.length} merged branch(es).`);
