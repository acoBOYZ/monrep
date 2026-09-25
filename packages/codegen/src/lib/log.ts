import path from "node:path";
import { getActiveTarget } from "../package-context";
import { ROOT } from "../root";

/** Tiny ANSI helpers. No deps. Respects NO_COLOR. */
const useColor = process.env.NO_COLOR == null;

const wrap =
  (open: string, close = "\x1b[0m") =>
  (s: string) =>
    useColor ? `${open}${s}${close}` : s;

const dim = wrap("\x1b[2m");
const bold = wrap("\x1b[1m");
const green = wrap("\x1b[32m");
const cyan = wrap("\x1b[36m");
const yellow = wrap("\x1b[33m");
const magenta = wrap("\x1b[35m");

let packageTag = "";

export const setLogPackage = (name: string | null): void => {
  packageTag = name && name.length > 0 ? `:${name}` : "";
};

const prefix = (): string => dim(`[@monrep/codegen${packageTag}]`);

let lastLoggedAt = performance.now();

/** Call at the start of each pipeline run so file lines show delta ms. */
export const markRunStart = (): void => {
  lastLoggedAt = performance.now();
};

/** ms since previous log line (or run start). */
const lineCost = (): string => {
  const now = performance.now();
  const ms = Math.round(now - lastLoggedAt);
  lastLoggedAt = now;
  return yellow(`${ms}ms`);
};

/** Workspace relative display + OSC-8 link so Cursor/VS Code can open on click. */
export const linkPath = (filePath: string): string => {
  const abs = path.resolve(filePath);
  const rel = path.relative(ROOT, abs);
  const display = rel.length > 0 && !rel.startsWith("..") ? rel : abs;
  if (!useColor) return display;
  return `\x1b]8;;file://${abs}\x07${cyan(display)}\x1b]8;;\x07`;
};

export const logUpdated = (filePath: string): void => {
  console.log(`${prefix()} ${green("✓")} ${cyan("updated")} ${linkPath(filePath)} ${lineCost()}`);
};

export const logScaffolded = (filePath: string): void => {
  console.log(
    `${prefix()} ${magenta("+")} ${cyan("scaffold")} ${linkPath(filePath)} ${lineCost()}`,
  );
};

export const logDone = (ms: number): void => {
  console.log(`${prefix()} ${green(bold("done"))} ${yellow(`${ms}ms`)}`);
};

export const logWatch = (message: string): void => {
  console.log(`${prefix()} ${magenta("watch")} ${message}`);
};

export const logInfo = (message: string): void => {
  console.log(`${prefix()} ${message}`);
};

/** Edit instead of path for generated headers (active package doDir). */
export const activeDoEditHint = (): string => {
  try {
    const { packageName, paths } = getActiveTarget();
    const rel = path.relative(ROOT, paths.doDir);
    return `DO modules under ${rel} (package ${packageName})`;
  } catch {
    return "DO modules under the package doDir from codegen.config.ts";
  }
};
