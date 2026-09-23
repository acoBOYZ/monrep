export type TaskId = "doCreateSchema" | "doIndex" | "doTypes" | "dbCollectionsDo";

export const PIPELINE: Array<TaskId> = ["doCreateSchema", "doIndex", "doTypes", "dbCollectionsDo"];

const TASK_IDS = new Set<string>(PIPELINE);

export const isTaskId = (value: string): value is TaskId => TASK_IDS.has(value);

export const DEPENDS_ON: Record<TaskId, Array<TaskId>> = {
  doCreateSchema: [],
  doIndex: ["doCreateSchema"],
  doTypes: ["doIndex"],
  dbCollectionsDo: ["doIndex", "doTypes"],
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
