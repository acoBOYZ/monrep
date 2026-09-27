#!/usr/bin/env bun
/// <reference types="bun" />

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");
const outDir = path.join(root, "dist");
const binName = "monrep";
const outBin = path.join(outDir, process.platform === "win32" ? `${binName}.exe` : binName);

mkdirSync(outDir, { recursive: true });

const proc = Bun.spawn(
  ["cargo", "build", "-j", "3", "--release", "--bin", binName, "--message-format=json"],
  {
    cwd: root,
    stdout: "pipe",
    stderr: "inherit",
  },
);

type CargoMessage = {
  reason?: string;
  executable?: string | null;
  target?: { name?: string; kind?: Array<string> };
};

const text = await new Response(proc.stdout).text();
const code = await proc.exited;
if (code !== 0) process.exit(code);

let executable: string | undefined;
for (const line of text.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  let msg: CargoMessage;
  try {
    msg = JSON.parse(trimmed) as CargoMessage;
  } catch {
    continue;
  }
  if (msg.reason !== "compiler-artifact") continue;
  if (!msg.target?.kind?.includes("bin")) continue;
  if (msg.target.name !== binName) continue;
  if (typeof msg.executable === "string" && msg.executable.length > 0) {
    executable = msg.executable;
  }
}

if (!executable || !existsSync(executable)) {
  console.error(`cargo did not report ${binName} executable`);
  process.exit(1);
}

copyFileSync(executable, outBin);
console.log(`✔ ${binName} → ${outBin}`);
