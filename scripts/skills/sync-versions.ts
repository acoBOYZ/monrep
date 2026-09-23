#!/usr/bin/env bun
/// <reference types="bun" />

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const agentSkillsRoot = path.join(process.cwd(), "packages/agent-skills");
const packageJsonPath = path.join(agentSkillsRoot, "package.json");
const skillsDir = path.join(agentSkillsRoot, "skills");

const { version } = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
  version: string;
};

let updated = 0;

for (const skillName of readdirSync(skillsDir, { withFileTypes: true })) {
  if (!skillName.isDirectory()) continue;

  const skillFile = path.join(skillsDir, skillName.name, "SKILL.md");
  if (!existsSync(skillFile)) {
    console.warn(`skip ${skillName.name}: missing SKILL.md`);
    continue;
  }

  const content = readFileSync(skillFile, "utf8");
  if (!/^\s*library:\s*agent-skills\s*$/m.test(content)) continue;

  const next = content.replace(/^(\s*library_version:\s*)['"][^'"]+['"]/m, `$1'${version}'`);

  if (next === content) continue;

  writeFileSync(skillFile, next);
  updated += 1;
  console.log(`synced ${skillName.name} → ${version}`);
}

if (updated === 0) {
  console.log(`all skills already at library_version ${version}`);
}
