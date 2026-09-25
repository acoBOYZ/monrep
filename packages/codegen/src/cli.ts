import { gracefulShutdown } from "./graceful";
import { logInfo, setLogPackage } from "./lib/log";
import { discoverTargets, filterTargets } from "./package-context";
import { isTaskId, runAllForTarget, runFromForTarget } from "./pipeline";
import { startWatch } from "./watch";

type Mode = "start" | "watch" | "run";

type ParsedArgs = {
  mode: Mode;
  packageFilter: string | null;
  taskId: string | null;
};

function parseArgs(argv: Array<string>): ParsedArgs {
  const args = [...argv];
  let mode: Mode = "start";
  let packageFilter: string | null = null;
  let taskId: string | null = null;

  const first = args[0];
  if (first === "start" || first === "watch" || first === "run") {
    mode = first;
    args.shift();
  } else if (first != null && first !== "--package" && first !== "-p" && !first.startsWith("--")) {
    // Bare package filter with default mode start: `codegen main`
    packageFilter = first;
    args.shift();
  }

  if (mode === "run") {
    taskId = args.shift() ?? null;
  }

  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === "--package" || a === "-p") {
      packageFilter = args[i + 1] ?? null;
      i += 1;
      continue;
    }
    if (a.startsWith("--package=")) {
      packageFilter = a.slice("--package=".length);
      continue;
    }
    if (!a.startsWith("-") && packageFilter == null) {
      packageFilter = a;
    }
  }

  return { mode, packageFilter, taskId };
}

const { mode, packageFilter, taskId } = parseArgs(process.argv.slice(2));

const all = await discoverTargets();
const targets = filterTargets(all, packageFilter);

if (targets.length === 0) {
  console.error(
    "[codegen] no packages with codegen.config.ts under packages/. Add one (e.g. packages/main/codegen.config.ts)",
  );
  process.exit(1);
}

if (mode === "run") {
  if (!taskId || !isTaskId(taskId)) {
    console.error(`[codegen] unknown task: ${taskId ?? "(missing)"} (use a pipeline TaskId)`);
    process.exit(1);
  }
  try {
    for (const target of targets) {
      await runFromForTarget(target, taskId);
    }
    process.exit(0);
  } catch (err) {
    console.error("[codegen] run failed:", err);
    process.exit(1);
  }
}

if (mode === "start") {
  try {
    for (const target of targets) {
      await runAllForTarget(target);
    }
    process.exit(0);
  } catch (err) {
    console.error("[codegen] start failed:", err);
    process.exit(1);
  }
}

// mode === "watch"
setLogPackage(packageFilter);
const watchService = startWatch(targets);
const shutdown = () => {
  void gracefulShutdown(watchService);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

logInfo(`service started in watch mode (${targets.map((t) => t.packageName).join(", ")}).`);
