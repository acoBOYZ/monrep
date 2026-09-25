import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { activeDoEditHint, logUpdated } from "./log";
import type { TaskId } from "../pipeline-graph";

const TASK_LABEL: Record<TaskId, string> = {
  doIndex: "DO schema index",
  doTypes: "DO row types",
  dbCollectionsDo: "DO TanStack DB collections",
  emitRegistry: "DO registry bind",
  emitUseStreamDb: "typed useStreamDb hook",
  ensureBarrels: "public db barrels",
};

export function generatedHeader(task: TaskId): string {
  const editInstead = activeDoEditHint();
  return [
    "// @generated: [AUTO-GENERATED] FILE. DO NOT EDIT.",
    "//",
    `// Generator : @monrep/codegen (${TASK_LABEL[task]})`,
    `// Task      : ${task}`,
    `// Source    : ${editInstead}`,
    "//",
    "// Regenerate: bun run codegen [-- --package <name>]",
    "// Watch     : bun run --cwd packages/codegen watch [-- --package <name>]",
    "//",
    `// Edit instead: ${editInstead}`,
    "",
    "",
  ].join("\n");
}

const withHeader = (body: string, task?: TaskId): string =>
  task ? `${generatedHeader(task)}${body}` : body;

export const writeIfChanged = async (
  filePath: string,
  body: string,
  task?: TaskId,
): Promise<boolean> => {
  const content = withHeader(body, task);
  mkdirSync(path.dirname(filePath), { recursive: true });
  const cur = existsSync(filePath) ? await Bun.file(filePath).text() : "";
  if (content === cur) return false;
  writeFileSync(filePath, content, "utf8");
  logUpdated(filePath);
  return true;
};

export const writeGenerated = (filePath: string, body: string, task?: TaskId): void => {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, withHeader(body, task), "utf8");
  logUpdated(filePath);
};
