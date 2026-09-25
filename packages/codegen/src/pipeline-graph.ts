export type TaskId =
  | "doIndex"
  | "doTypes"
  | "dbCollectionsDo"
  | "emitRegistry"
  | "emitUseStreamDb"
  | "ensureBarrels";

export const PIPELINE: Array<TaskId> = [
  "doIndex",
  "doTypes",
  "dbCollectionsDo",
  "emitRegistry",
  "emitUseStreamDb",
  "ensureBarrels",
];

const TASK_IDS = new Set<string>(PIPELINE);

export const isTaskId = (value: string): value is TaskId => TASK_IDS.has(value);

export const DEPENDS_ON: Record<TaskId, Array<TaskId>> = {
  doIndex: [],
  doTypes: ["doIndex"],
  dbCollectionsDo: ["doIndex", "doTypes"],
  emitRegistry: ["dbCollectionsDo"],
  emitUseStreamDb: ["dbCollectionsDo"],
  ensureBarrels: ["emitRegistry", "emitUseStreamDb"],
};

export const downstreamOf = (from: TaskId): Array<TaskId> => {
  const selected = new Set<TaskId>([from]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of PIPELINE) {
      if (selected.has(id)) continue;
      if (DEPENDS_ON[id].some((dep) => selected.has(dep))) {
        selected.add(id);
        changed = true;
      }
    }
  }
  return PIPELINE.filter((id) => selected.has(id));
};
