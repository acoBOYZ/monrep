import { gracefulShutdown } from "./graceful";
import { logInfo } from "./lib/log";
import { isTaskId, runAll, runFrom } from "./pipeline";
import { startWatch } from "./watch";

const mode = process.argv[2] ?? "start";

if (mode === "run") {
  const taskId = process.argv[3];
  if (!taskId || !isTaskId(taskId)) {
    console.error(
      `[@monrep/codegen] unknown task: ${taskId ?? "(missing)"} (use a pipeline TaskId)`,
    );
    process.exit(1);
  }
  try {
    await runFrom(taskId);
    process.exit(0);
  } catch (err) {
    console.error("[@monrep/codegen] run failed:", err);
    process.exit(1);
  }
}

if (mode === "start") {
  try {
    await runAll();
    process.exit(0);
  } catch (err) {
    console.error("[@monrep/codegen] start failed:", err);
    process.exit(1);
  }
}

if (mode !== "watch") {
  console.error(`[@monrep/codegen] unknown mode: ${mode} (use start | watch | run <taskId>)`);
  process.exit(1);
}

const watchService = startWatch();
const shutdown = () => {
  void gracefulShutdown(watchService);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

logInfo(`service started in ${mode} mode.`);
