import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { logUpdated } from "./log";
import type { TaskId } from "../pipeline-graph";

const TASK_META: Record<TaskId, { label: string; sources: Array<string>; editInstead: string }> = {
  doCreateSchema: {
    label: "createDoModule factory",
    sources: ["packages/codegen/templates/create-do-module.gen.ts.tpl"],
    editInstead: "packages/codegen/templates/create-do-module.gen.ts.tpl",
  },
  doIndex: {
    label: "DO schema index",
    sources: ["packages/db/src/do/*.ts"],
    editInstead: "DO schema files under packages/db/src/do/",
  },
  doTypes: {
    label: "DO row types",
    sources: ["packages/db/src/do/*.ts"],
    editInstead: "DO schema files under packages/db/src/do/",
  },
  dbCollectionsDo: {
    label: "DO TanStack DB collections",
    sources: ["packages/db/src/do/*.ts"],
    editInstead: "DO schema files under packages/db/src/do/",
  },
};

export function generatedHeader(task: TaskId): string {
  const meta = TASK_META[task];
  return [
    "// @generated — AUTO-GENERATED FILE. DO NOT EDIT.",
    "//",
    `// Generator : @monrep/codegen (${meta.label})`,
    `// Task      : ${task}`,
    ...meta.sources.map((source) => `// Source    : ${source}`),
    "//",
    "// Regenerate: bun run codegen",
    "// Watch     : bun run --cwd packages/codegen watch",
    "//",
    `// Edit instead: ${meta.editInstead}`,
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
