import { logDone, logUpdated, markRunStart, setLogPackage } from "./lib/log";
import { withTarget } from "./package-context";
import { DEPENDS_ON, PIPELINE, downstreamOf, isTaskId } from "./pipeline-graph";
import type { CodegenTarget } from "./package-context";
import type { TaskId } from "./pipeline-graph";

export type { TaskId };
export { DEPENDS_ON, PIPELINE, downstreamOf, isTaskId };

type Runner = () => void | Promise<void>;

/** Lazy loaders so gens are imported only after upstream outputs are written. */
const LOADERS: Record<TaskId, () => Promise<Runner>> = {
  doIndex: async () => (await import("./tasks/do-index")).runDoIndex,
  doTypes: async () => (await import("./tasks/do-types")).runDoTypes,
  dbCollectionsDo: async () => (await import("./tasks/db-collections-do")).runDbCollectionsDo,
  emitRegistry: async () => (await import("./tasks/emit-registry")).runEmitRegistry,
  emitUseStreamDb: async () => (await import("./tasks/emit-use-stream-db")).runEmitUseStreamDb,
  ensureBarrels: async () => (await import("./tasks/ensure-barrels")).runEnsureBarrels,
};

async function runPipeline(taskIds: Array<TaskId>): Promise<void> {
  markRunStart();
  const t0 = performance.now();
  for (const id of taskIds) {
    const run = await LOADERS[id]();
    await run();
    logUpdated(id);
  }
  logDone(Math.round(performance.now() - t0));
}

export async function runAllForTarget(target: CodegenTarget): Promise<void> {
  setLogPackage(target.packageName);
  await withTarget(target, () => runPipeline(PIPELINE));
}

export async function runFromForTarget(target: CodegenTarget, from: TaskId): Promise<void> {
  setLogPackage(target.packageName);
  await withTarget(target, () => runPipeline(downstreamOf(from)));
}
