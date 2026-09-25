import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT } from "./root";
import type { CodegenConfig } from "./config";

export type ResolvedPackagePaths = {
  packageRoot: string;
  packageName: string;
  doDir: string;
  outDir: string;
  /** Parent of outDir. Public barrels live here (e.g. src/db). */
  dbRoot: string;
  doGen: string;
  typesGen: string;
  collectionsGen: string;
  registryGen: string;
  useStreamDbGen: string;
};

export type CodegenTarget = {
  packageRoot: string;
  packageName: string;
  config: CodegenConfig;
  paths: ResolvedPackagePaths;
};

let active: CodegenTarget | null = null;

export const getActiveTarget = (): CodegenTarget => {
  if (!active) {
    throw new Error("[codegen] no active package context - CLI must set a target before tasks");
  }
  return active;
};

export const setActiveTarget = (target: CodegenTarget | null): void => {
  active = target;
};

export const withTarget = async <T>(target: CodegenTarget, fn: () => Promise<T>): Promise<T> => {
  const prev = active;
  active = target;
  try {
    return await fn();
  } finally {
    active = prev;
  }
};

const resolveFrom = (packageRoot: string, rel: string): string => path.resolve(packageRoot, rel);

export function resolvePackagePaths(
  packageRoot: string,
  packageName: string,
  config: CodegenConfig,
): ResolvedPackagePaths {
  const outDir = resolveFrom(packageRoot, config.outDir);
  return {
    packageRoot,
    packageName,
    doDir: resolveFrom(packageRoot, config.doDir),
    outDir,
    dbRoot: path.dirname(outDir),
    doGen: path.join(outDir, "do.gen.ts"),
    typesGen: path.join(outDir, "types.gen.ts"),
    collectionsGen: path.join(outDir, "collections.gen.ts"),
    registryGen: path.join(outDir, "registry.gen.ts"),
    useStreamDbGen: path.join(outDir, "useStreamDb.gen.ts"),
  };
}

const CONFIG_NAME = "codegen.config.ts";

/** Discover workspace packages that ship a codegen.config.ts file. */
export async function discoverTargets(): Promise<Array<CodegenTarget>> {
  const packagesDir = path.join(ROOT, "packages");
  const entries = await readdir(packagesDir, { withFileTypes: true }).catch(() => []);
  const targets: Array<CodegenTarget> = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const packageRoot = path.join(packagesDir, entry.name);
    const configPath = path.join(packageRoot, CONFIG_NAME);
    if (!(await Bun.file(configPath).exists())) continue;

    const mod = (await import(pathToFileURL(configPath).href)) as {
      default?: unknown;
    };
    const raw = mod.default;
    if (raw == null || typeof raw !== "object") {
      throw new Error(
        "[codegen] " + configPath + ": expected defineConfig({ doDir, outDir }) default export",
      );
    }
    const config = raw as Partial<CodegenConfig>;
    if (typeof config.doDir !== "string" || typeof config.outDir !== "string") {
      throw new Error(
        "[codegen] " + configPath + ": expected defineConfig({ doDir, outDir }) default export",
      );
    }
    const resolved: CodegenConfig = {
      name: config.name,
      doDir: config.doDir,
      outDir: config.outDir,
    };

    const packageName = resolved.name ?? entry.name;
    targets.push({
      packageRoot,
      packageName,
      config: resolved,
      paths: resolvePackagePaths(packageRoot, packageName, resolved),
    });
  }

  targets.sort((a, b) => a.packageName.localeCompare(b.packageName));
  return targets;
}

export function filterTargets(
  all: Array<CodegenTarget>,
  packageFilter: string | null,
): Array<CodegenTarget> {
  if (!packageFilter) return all;
  const hit = all.filter(
    (t) => t.packageName === packageFilter || path.basename(t.packageRoot) === packageFilter,
  );
  if (hit.length === 0) {
    const known = all.map((t) => t.packageName).join(", ") || "(none)";
    throw new Error("[codegen] unknown package: " + packageFilter + " (discovered: " + known + ")");
  }
  return hit;
}
