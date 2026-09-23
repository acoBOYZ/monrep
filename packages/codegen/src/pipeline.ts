import { logDone, logUpdated, markRunStart } from "./lib/log";
import { DEPENDS_ON, PIPELINE, downstreamOf, isTaskId } from "./pipeline-graph";
import type { TaskId } from "./pipeline-graph";

export type { TaskId };
export { DEPENDS_ON, PIPELINE, downstreamOf, isTaskId };

type Runner = () => void | Promise<void>;

/** Lazy loaders so gens are imported only after upstream outputs are written. */
const LOADERS: Record<TaskId, () => Promise<Runner>> = {
  doCreateSchema: async () => (await import("./tasks/do-create-schema")).runDoCreateSchema,
  doIndex: async () => (await import("./tasks/do-index")).runDoIndex,
  doTypes: async () => (await import("./tasks/do-types")).runDoTypes,
  dbCollectionsDo: async () => (await import("./tasks/db-collections-do")).runDbCollectionsDo,
};

export async function runAll(): Promise<void> {
  markRunStart();
  const t0 = performance.now();

  for (const id of PIPELINE) {
    const run = await LOADERS[id]();
    await run();
    logUpdated(id);
  }

  logDone(Math.round(performance.now() - t0));
}

export async function runFrom(from: TaskId): Promise<void> {
  markRunStart();
  const t0 = performance.now();
  for (const id of downstreamOf(from)) {
    const run = await LOADERS[id]();
    await run();
  }
  logDone(Math.round(performance.now() - t0));
}
