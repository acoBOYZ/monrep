#!/usr/bin/env bun
/// <reference types="bun" />

/**
 * Bind monrep agent to local main (https://localhost:5274).
 * Trusts certs/vite-dev-root.crt, disables auto_update, optional enroll, then daemon.
 *
 *   bun run --cwd packages/agent local
 *   bun run --cwd packages/agent local -- --token <enroll-token>
 */

import { existsSync } from "node:fs";
import path from "node:path";

const agentRoot = path.resolve(import.meta.dir, "..");
const repoRoot = path.resolve(agentRoot, "../..");
const devCa = path.join(repoRoot, "certs", "vite-dev-root.crt");

function parseArgs(argv: Array<string>): { token?: string } {
  let token: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--token" || a === "-t") {
      token = argv[++i];
      continue;
    }
    if (a && a.startsWith("--token=")) {
      token = a.slice("--token=".length);
    }
  }
  return { token };
}

async function cargoMonrep(
  args: Array<string>,
  env: Record<string, string>,
  opts?: { capture?: boolean },
): Promise<{ code: number; stdout: string; stderr: string }> {
  const capture = opts?.capture ?? false;
  const proc = Bun.spawn(["cargo", "run", "--bin", "monrep", "--", ...args], {
    cwd: agentRoot,
    env: { ...process.env, ...env },
    stdin: "inherit",
    stdout: capture ? "pipe" : "inherit",
    stderr: capture ? "pipe" : "inherit",
  });
  const stdout = capture && proc.stdout ? await new Response(proc.stdout).text() : "";
  const stderr = capture && proc.stderr ? await new Response(proc.stderr).text() : "";
  const code = await proc.exited;
  return { code, stdout, stderr };
}

if (!existsSync(devCa)) {
  console.error(`missing ${devCa}`);
  console.error("run from repo root: bun run setup:dev");
  process.exit(1);
}

const controlUrl = process.env.MONREP_CONTROL_URL?.trim() || "https://localhost:5274";
const env = {
  MONREP_DEV_CA: path.resolve(devCa),
  MONREP_CONTROL_URL: controlUrl,
};

const { token } = parseArgs(process.argv.slice(2));

console.log(`→ MONREP_DEV_CA=${env.MONREP_DEV_CA}`);
console.log(`→ control URL ${controlUrl}`);

let { code } = await cargoMonrep(["config", "--auto-update", "false"], env);
if (code !== 0) process.exit(code);

if (token) {
  console.log("→ unenroll (clear prior binding before re-token)");
  const cleared = await cargoMonrep(["unenroll"], env, { capture: true });
  process.stdout.write(cleared.stdout);
  process.stderr.write(cleared.stderr);
  if (cleared.code !== 0) process.exit(cleared.code);

  console.log(`→ enroll --url ${controlUrl}`);
  const enroll = await cargoMonrep(["enroll", "--url", controlUrl, "--token", token], env, {
    capture: true,
  });
  process.stdout.write(enroll.stdout);
  process.stderr.write(enroll.stderr);
  if (enroll.code !== 0) {
    const combined = `${enroll.stdout}\n${enroll.stderr}`;
    if (combined.includes("already enrolled")) {
      console.error("→ still enrolled after unenroll; run: cargo run --bin monrep -- unenroll");
    }
    process.exit(enroll.code);
  }
}

console.log("→ daemon (ctrl-c to stop)");
({ code } = await cargoMonrep(["daemon"], env));
process.exit(code);
