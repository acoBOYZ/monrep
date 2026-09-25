import { existsSync, watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AsyncDebouncer } from "@tanstack/pacer";
import { logWatch, setLogPackage } from "./lib/log";
import { PIPELINE, downstreamOf } from "./pipeline-graph";
import { CODEGEN_ROOT } from "./root";
import { BARREL_FILE_NAMES } from "./tasks/ensure-barrels";
import type { FSWatcher } from "node:fs";
import type { CodegenTarget } from "./package-context";
import type { TaskId } from "./pipeline-graph";

const DEBOUNCE_MS = 150;
const CLI_PATH = fileURLToPath(new URL("./cli.ts", import.meta.url));

type PendingJob = { packageName: string; task: TaskId };

const isDoModuleFile = (name: string) =>
  name.endsWith(".ts") &&
  !name.endsWith(".gen.ts") &&
  name !== "index.ts" &&
  !name.endsWith(".d.ts");

export function startWatch(targets: Array<CodegenTarget>) {
  const pending: Array<PendingJob> = [];
  const watchers: Array<FSWatcher> = [];
  let activeChild: ReturnType<typeof Bun.spawn> | null = null;
  const ctl = { shuttingDown: false, draining: false };

  const enqueue = (packageName: string, task: TaskId) => {
    if (ctl.shuttingDown) return;
    if (!pending.some((p) => p.packageName === packageName && p.task === task)) {
      pending.push({ packageName, task });
    }
    void debouncer.maybeExecute();
  };

  const drain = async () => {
    if (ctl.draining || ctl.shuttingDown) return;
    ctl.draining = true;
    try {
      while (pending.length > 0) {
        const snapshot = [...pending];
        let next: PendingJob | null = null;
        for (const id of PIPELINE) {
          next = snapshot.find((p) => p.task === id) ?? null;
          if (next) break;
        }
        if (!next) break;

        setLogPackage(next.packageName);
        logWatch(`→ ${next.packageName}/${next.task} (spawn)`);
        const child = Bun.spawn(
          ["bun", CLI_PATH, "run", next.task, "--package", next.packageName],
          {
            cwd: CODEGEN_ROOT,
            stdout: "inherit",
            stderr: "inherit",
          },
        );
        activeChild = child;
        const code = await child.exited;
        activeChild = null;

        if (code !== 0) {
          console.error(
            `[@monrep/codegen:${next.packageName}] watch spawn failed: ${next.task} (exit ${code})`,
          );
        }

        const covered = new Set(downstreamOf(next.task));
        for (let i = pending.length - 1; i >= 0; i--) {
          const job = pending[i]!;
          if (job.packageName === next.packageName && covered.has(job.task)) {
            pending.splice(i, 1);
          }
        }
      }
    } catch (err) {
      console.error("[@monrep/codegen] watch failed:", err);
      activeChild = null;
    } finally {
      ctl.draining = false;
      if (pending.length > 0) {
        void debouncer.maybeExecute();
      }
    }
  };

  const debouncer = new AsyncDebouncer(
    async () => {
      await drain();
    },
    {
      wait: DEBOUNCE_MS,
      leading: false,
      trailing: true,
      onError: (error) => {
        console.error("[@monrep/codegen] watch debounce failed:", error);
      },
    },
  );

  for (const target of targets) {
    try {
      const doWatcher = watch(target.paths.doDir, (_event, filename) => {
        if (!filename || typeof filename !== "string") return;
        const name = path.basename(filename);
        if (!isDoModuleFile(name)) return;
        enqueue(target.packageName, "doIndex");
      });
      doWatcher.on("error", (err) => {
        console.error(`[@monrep/codegen] watch error (${target.paths.doDir}):`, err);
      });
      watchers.push(doWatcher);
    } catch (err) {
      console.error(`[@monrep/codegen] failed to watch ${target.paths.doDir}:`, err);
    }

    try {
      const barrelWatcher = watch(target.paths.dbRoot, (_event, filename) => {
        if (!filename || typeof filename !== "string") return;
        const name = path.basename(filename);
        if (!BARREL_FILE_NAMES.has(name)) return;
        // Only recreate when missing (ignore our own write / edits).
        if (existsSync(path.join(target.paths.dbRoot, name))) return;
        enqueue(target.packageName, "ensureBarrels");
      });
      barrelWatcher.on("error", (err) => {
        console.error(`[@monrep/codegen] watch error (${target.paths.dbRoot}):`, err);
      });
      watchers.push(barrelWatcher);
    } catch (err) {
      console.error(`[@monrep/codegen] failed to watch ${target.paths.dbRoot}:`, err);
    }
  }

  logWatch(`(${targets.length} packages, doDir + barrels, debounce ${DEBOUNCE_MS}ms)`);

  return () => {
    ctl.shuttingDown = true;
    pending.length = 0;
    debouncer.cancel();
    for (const watcher of watchers) {
      watcher.close();
    }
    if (activeChild) {
      activeChild.kill();
      activeChild = null;
    }
  };
}
