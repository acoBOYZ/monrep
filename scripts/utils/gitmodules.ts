import { readFileSync } from "node:fs";

export type GitSubmodule = { path: string; url: string };

export function parseGitmodules(text: string): Array<GitSubmodule> {
  const entries: Array<GitSubmodule> = [];
  let path: string | undefined;
  let url: string | undefined;
  const flush = () => {
    if (path && url) entries.push({ path, url });
    path = undefined;
    url = undefined;
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("[submodule")) {
      flush();
      continue;
    }
    if (line.startsWith("path =")) path = line.slice("path =".length).trim();
    else if (line.startsWith("url =")) url = line.slice("url =".length).trim();
  }
  flush();
  return entries;
}

export function readGitmodules(file: string): Array<GitSubmodule> {
  return parseGitmodules(readFileSync(file, "utf8"));
}

export function isGitmodulePath(rel: string, modules: Array<GitSubmodule>): boolean {
  return modules.some((mod) => rel === mod.path || rel.startsWith(`${mod.path}/`));
}
