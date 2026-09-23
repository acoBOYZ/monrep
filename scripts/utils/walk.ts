/**
 * Shared monorepo filesystem walk.
 * Defaults skip build/deps trees (node_modules, target, …) and tolerate ENOENT races.
 * Callers extend via `skipDirs` / `ignore`. Not for cargo-prune (must enter target)
 * or shallow codegen readdirs.
 */
import { readdirSync, statSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { normalizePath } from "./path";

/** Directory basenames never entered unless the caller overrides skipDirs entirely. */
export const DEFAULT_SKIP_DIRS: ReadonlySet<string> = new Set([
  "node_modules",
  "target",
  "vendor",
  "dist",
  "build",
  "coverage",
  "upstream",
  ".git",
  ".turbo",
  ".next",
  ".output",
  ".data",
  ".tmp",
  ".vercel",
  ".cursor",
  ".claude",
  ".vscode",
  ".agents",
  ".demo",
  ".example",
  ".sample-files",
  ".profiling",
]);

export type WalkIgnore = (args: {
  name: string;
  full: string;
  rel: string;
  isDirectory: boolean;
}) => boolean;

export type WalkOptions = {
  /** Extra basenames never to descend into (merged with defaults). */
  skipDirs?: Iterable<string>;
  /** Replace defaults instead of merging. */
  skipDirsOnly?: Iterable<string>;
  /** Skip basenames starting with `.` (default true). */
  skipDot?: boolean;
  /** Return true to skip this entry (after skipDirs / skipDot). */
  ignore?: WalkIgnore;
  onFile?: (args: { name: string; full: string; rel: string }) => void | Promise<void>;
  onDir?: (args: { name: string; full: string; rel: string }) => void | Promise<void>;
};

function skipSet(opts?: WalkOptions): Set<string> {
  if (opts?.skipDirsOnly) return new Set(opts.skipDirsOnly);
  const set = new Set(DEFAULT_SKIP_DIRS);
  if (opts?.skipDirs) for (const d of opts.skipDirs) set.add(d);
  return set;
}

function shouldSkipName(name: string, dirs: Set<string>, skipDot: boolean): boolean {
  if (dirs.has(name)) return true;
  if (skipDot && name.startsWith(".")) return true;
  return false;
}

function relOf(root: string, full: string): string {
  return normalizePath(relative(root, full));
}

export function walkSync(root: string, opts: WalkOptions = {}): void {
  const dirs = skipSet(opts);
  const skipDot = opts.skipDot !== false;
  const rootN = normalizePath(root);

  const visit = (dir: string) => {
    let names: Array<string>;
    try {
      names = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of names) {
      if (shouldSkipName(name, dirs, skipDot)) continue;
      const full = join(dir, name);
      const rel = relOf(rootN, full);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      const isDirectory = st.isDirectory();
      if (opts.ignore?.({ name, full: normalizePath(full), rel, isDirectory })) continue;
      if (isDirectory) {
        void opts.onDir?.({ name, full: normalizePath(full), rel });
        visit(full);
      } else {
        void opts.onFile?.({ name, full: normalizePath(full), rel });
      }
    }
  };

  visit(root);
}

export async function walk(root: string, opts: WalkOptions = {}): Promise<void> {
  const dirs = skipSet(opts);
  const skipDot = opts.skipDot !== false;
  const rootN = normalizePath(root);

  const visit = async (dir: string) => {
    let names: Array<string>;
    try {
      names = await readdir(dir);
    } catch {
      return;
    }
    for (const name of names) {
      if (shouldSkipName(name, dirs, skipDot)) continue;
      const full = join(dir, name);
      const rel = relOf(rootN, full);
      let st;
      try {
        st = await stat(full);
      } catch {
        continue;
      }
      const isDirectory = st.isDirectory();
      if (opts.ignore?.({ name, full: normalizePath(full), rel, isDirectory })) continue;
      if (isDirectory) {
        await opts.onDir?.({ name, full: normalizePath(full), rel });
        await visit(full);
      } else {
        await opts.onFile?.({ name, full: normalizePath(full), rel });
      }
    }
  };

  await visit(root);
}

/** Collect file paths where `match` returns true. */
export async function findFiles(
  root: string,
  match: (name: string, rel: string) => boolean,
  opts: Omit<WalkOptions, "onFile" | "onDir"> = {},
): Promise<Array<string>> {
  const out: Array<string> = [];
  await walk(root, {
    ...opts,
    onFile: ({ name, full, rel }) => {
      if (match(name, rel)) out.push(full);
    },
  });
  return out;
}

export function findFilesSync(
  root: string,
  match: (name: string, rel: string) => boolean,
  opts: Omit<WalkOptions, "onFile" | "onDir"> = {},
): Array<string> {
  const out: Array<string> = [];
  walkSync(root, {
    ...opts,
    onFile: ({ name, full, rel }) => {
      if (match(name, rel)) out.push(full);
    },
  });
  return out;
}
