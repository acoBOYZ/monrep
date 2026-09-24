#!/usr/bin/env bun
/// <reference types="bun" />

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { readGitmodules } from "../utils/gitmodules";
import { exitIfCi } from "../utils/is-ci";
import type { GitSubmodule } from "../utils/gitmodules";

exitIfCi("\nCI detected — skipping upstream pin upgrade\n");

const ROOT = process.cwd();
const GITMODULES = join(ROOT, ".gitmodules");
const TEMPLATE_DIR = join(ROOT, "packages/.templates/upstream");
const VERSION = (
  JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { version: string }
).version;

async function run(cmd: Array<string>, cwd: string) {
  const proc = Bun.spawn({
    cmd,
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await proc.exited;
  if (code !== 0) process.exit(code);
}

async function tryRun(cmd: Array<string>, cwd: string): Promise<boolean> {
  const proc = Bun.spawn({
    cmd,
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  return (await proc.exited) === 0;
}

async function capture(cmd: Array<string>, cwd: string, allowFail = false): Promise<string> {
  const proc = Bun.spawn({
    cmd,
    cwd,
    stdout: "pipe",
    stderr: allowFail ? "pipe" : "inherit",
  });
  const text = await new Response(proc.stdout).text();
  const code = await proc.exited;
  if (code !== 0 && !allowFail) process.exit(code);
  return text.trim();
}

function pinName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 2] ?? path;
}

function parseOnly(): string | undefined {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--only");
  if (idx < 0) return undefined;
  const value = args[idx + 1];
  if (!value || value.startsWith("-")) {
    console.error("usage: bun run scripts/upgrade/upstream.ts [--only <name|path>]");
    process.exit(1);
  }
  return value;
}

function matchesOnly(sub: GitSubmodule, only: string): boolean {
  return sub.path === only || pinName(sub.path) === only;
}

function parsePinnedCommit(pinMd: string): string | null {
  const match = pinMd.match(/- Commit: `([0-9a-f]{7,40})`/i);
  return match?.[1] ?? null;
}

/** True if two SHAs name the same commit (full or abbreviated). */
function sameCommit(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x === y || x.startsWith(y) || y.startsWith(x);
}

function historyIdOf(name: string, pinMd: string): string {
  const match = pinMd.match(/<!-- ([a-z0-9-]+-pin-history):start -->/);
  return match?.[1] ?? `${name}-pin-history`;
}

function parsePinHistory(pinMd: string, historyId: string): Array<string> {
  const startTag = `<!-- ${historyId}:start -->`;
  const endTag = `<!-- ${historyId}:end -->`;
  const start = pinMd.indexOf(startTag);
  const end = pinMd.indexOf(endTag);
  if (start < 0 || end < 0 || end <= start) return [];
  return pinMd
    .slice(start + startTag.length, end)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "));
}

function displayUrl(url: string): string {
  return url.replace(/\.git$/, "");
}

const color =
  process.env.NO_COLOR || !process.stdout.isTTY
    ? { reset: "", bold: "", dim: "", cyan: "", green: "", yellow: "" }
    : {
        reset: "\x1b[0m",
        bold: "\x1b[1m",
        dim: "\x1b[2m",
        cyan: "\x1b[36m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
      };

function paint(codes: string, text: string): string {
  return `${codes}${text}${color.reset}`;
}

function pkgMeta(pkg: string): { name: string; version: string; description: string } {
  const file = join(pkg, "package.json");
  if (!existsSync(file)) return { name: "", version: "", description: "" };
  const json = JSON.parse(readFileSync(file, "utf8")) as {
    name?: string;
    version?: string;
    description?: string;
  };
  return {
    name: json.name ?? "",
    version: json.version ?? "",
    description: json.description ?? "",
  };
}

function announceUpgrade(opts: {
  pkg: string;
  fallback: string;
  from: string;
  to: string;
  branch: string;
  subject: string;
}) {
  const meta = pkgMeta(opts.pkg);
  console.log("");
  console.log(
    `  ${paint(`${color.bold}${color.cyan}`, meta.name || opts.fallback)}  ${paint(`${color.bold}${color.yellow}`, meta.version)}`,
  );
  if (meta.description) console.log(`  ${meta.description}`);
  console.log(
    `  ${paint(color.dim, opts.from.slice(0, 12))}  →  ${paint(`${color.bold}${color.green}`, opts.to)}`,
  );
  if (opts.subject) console.log(`  ${paint(color.dim, opts.branch)}  ${opts.subject}`);
  console.log("");
}

function hasGit(dir: string): boolean {
  return existsSync(join(dir, ".git"));
}

function render(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = vars[key];
    if (value === undefined) throw new Error(`Missing template placeholder {{${key}}}`);
    return value;
  });
}

function collectTemplates(dir: string, relativeDir = ""): Array<string> {
  const files: Array<string> = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = relativeDir ? join(relativeDir, entry.name) : entry.name;
    if (entry.isDirectory()) {
      files.push(...collectTemplates(join(dir, entry.name), rel));
      continue;
    }
    if (entry.name.endsWith(".tpl")) files.push(rel);
  }
  return files;
}

function scaffold(pkg: string, vars: Record<string, string>) {
  if (!existsSync(TEMPLATE_DIR)) {
    console.error(`Missing ${TEMPLATE_DIR}`);
    process.exit(1);
  }
  mkdirSync(pkg, { recursive: true });
  for (const rel of collectTemplates(TEMPLATE_DIR)) {
    const out = join(pkg, rel.replace(/\.tpl$/, ""));
    if (existsSync(out)) continue;
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, render(readFileSync(join(TEMPLATE_DIR, rel), "utf8"), vars));
    console.log(`  + ${out.slice(ROOT.length + 1)}`);
  }
}

async function ensureSubmodule(sub: GitSubmodule) {
  const dest = join(ROOT, sub.path);
  await tryRun(["git", "submodule", "sync", "--", sub.path], ROOT);
  await tryRun(["git", "submodule", "update", "--init", "--recursive", "--", sub.path], ROOT);
  if (hasGit(dest)) return;
  if (!(await tryRun(["git", "submodule", "add", sub.url, sub.path], ROOT))) {
    await tryRun(["git", "submodule", "add", "--force", sub.url, sub.path], ROOT);
  }
  await tryRun(["git", "submodule", "update", "--init", "--recursive", "--", sub.path], ROOT);
  if (!hasGit(dest)) {
    console.error(`Failed to checkout submodule ${sub.path}`);
    process.exit(1);
  }
}

function upsertPinMd(opts: {
  existing: string;
  name: string;
  url: string;
  full: string;
  short: string;
  branch: string;
  historyId: string;
  historyLines: Array<string>;
}): string {
  const historyBody = opts.historyLines.length > 0 ? `\n${opts.historyLines.join("\n")}\n` : "\n";
  const startTag = `<!-- ${opts.historyId}:start -->`;
  const endTag = `<!-- ${opts.historyId}:end -->`;
  const commit = `- Commit: \`${opts.full}\` (short \`${opts.short}\`, branch \`${opts.branch}\`)`;
  const upstreamLine = `- Upstream: ${displayUrl(opts.url)}`;

  if (!opts.existing) {
    return `# ${opts.name} pin

${upstreamLine}
${commit}

## Pin history

Previous pins we used in this monorepo (newest first). Kept so we can roll the submodule back safely.

${startTag}${historyBody}${endTag}

## Upgrade

Run via \`bun run scripts/stack/up-dev.ts\` (calls \`scripts/upgrade/upstream.ts\`), or manually:

\`\`\`bash
bun run scripts/upgrade/upstream.ts --only ${opts.name}
\`\`\`

On each successful tip change, \`upgrade/upstream.ts\` moves the previous pin into **Pin history** with an ISO timestamp.
`;
  }

  let md = opts.existing;
  md = md.replace(/^- Upstream: .+$/m, upstreamLine);
  md = md.replace(/^- Commit: .+$/m, commit);
  md = md.replace(/^- Module path: .+\n?/m, "");
  const start = md.indexOf(startTag);
  const end = md.indexOf(endTag);
  if (start >= 0 && end > start) {
    md = `${md.slice(0, start)}${startTag}${historyBody}${md.slice(end)}`;
  }
  return md;
}

if (!existsSync(GITMODULES)) {
  console.error(`Missing ${GITMODULES}`);
  process.exit(1);
}

const submodules = readGitmodules(GITMODULES);
if (submodules.length === 0) {
  console.error("No submodules in .gitmodules");
  process.exit(1);
}

const only = parseOnly();
const selected = submodules.filter((sub) => (only ? matchesOnly(sub, only) : true));

if (only && selected.length === 0) {
  console.error(`no submodule matched --only ${only}`);
  process.exit(1);
}

for (const sub of selected) {
  const upstream = join(ROOT, sub.path);
  const pkg = join(ROOT, dirname(sub.path));
  const pinFile = join(pkg, "PIN.md");
  const name = pinName(sub.path);

  console.log(`\n🔄 Updating ${name} upstream...\n`);

  await ensureSubmodule(sub);

  const before = await capture(["git", "rev-parse", "HEAD"], upstream);
  const existingPin = existsSync(pinFile) ? readFileSync(pinFile, "utf8") : "";
  const historyId = historyIdOf(name, existingPin);
  const history = parsePinHistory(existingPin, historyId);

  await run(["git", "fetch", "--depth", "1", "origin"], upstream);
  await capture(["git", "remote", "set-head", "origin", "-a"], upstream, true);
  await run(["git", "reset", "--hard", "HEAD"], upstream);
  await run(["git", "clean", "-fd"], upstream);

  let remoteHead = "origin/main";
  const symbolic = await capture(
    ["git", "symbolic-ref", "--quiet", "refs/remotes/origin/HEAD"],
    upstream,
    true,
  );
  if (symbolic.startsWith("refs/remotes/")) {
    remoteHead = symbolic.replace(/^refs\/remotes\//, "");
  }

  await run(["git", "checkout", "--detach", remoteHead], upstream);

  const afterSha = await capture(["git", "rev-parse", "HEAD"], upstream);
  const short = await capture(["git", "rev-parse", "--short=12", "HEAD"], upstream);

  if (!existsSync(join(pkg, "package.json"))) {
    scaffold(pkg, {
      name,
      package: `@monrep/${name}`,
      path: dirname(sub.path),
      url: displayUrl(sub.url),
      version: VERSION,
    });
  }

  // Pin is source of truth for "do we already have this tip?" — not local HEAD.
  // A drifted submodule checkout must not rewrite PIN.md or stamp a new UTC history row.
  const pinned = parsePinnedCommit(existingPin);
  const tipIsNew = !pinned || !sameCommit(pinned, afterSha);

  if (!tipIsNew) {
    console.log(`  ✓ already on latest ${remoteHead} (${short})\n`);
    continue;
  }

  let nextHistory = history;
  if (pinned) {
    const replacedAt = new Date().toISOString();
    const previousShort = pinned.slice(0, 12);
    const entry = `- \`${pinned}\` (short \`${previousShort}\`) — replaced ${replacedAt}`;
    nextHistory = [entry, ...history.filter((line) => !line.includes(pinned))];
  }

  const nextPin = upsertPinMd({
    existing: existingPin,
    name,
    url: sub.url,
    full: afterSha,
    short,
    branch: remoteHead,
    historyId,
    historyLines: nextHistory,
  });
  writeFileSync(pinFile, nextPin);

  const subject = await capture(["git", "log", "-1", "--format=%s"], upstream, true);
  announceUpgrade({
    pkg,
    fallback: name,
    from: pinned ?? before,
    to: short,
    branch: remoteHead,
    subject,
  });
}
