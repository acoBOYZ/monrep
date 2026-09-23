import { watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AsyncDebouncer } from "@tanstack/pacer";
import { logWatch } from "./lib/log";
import { paths } from "./paths";
import { PIPELINE, downstreamOf } from "./pipeline-graph";
import type { FSWatcher } from "node:fs";
import type { TaskId } from "./pipeline-graph";

const DEBOUNCE_MS = 150;
const CLI_PATH = fileURLToPath(new URL("./cli.ts", import.meta.url));

type WatchRule = {
  task: TaskId;
  dir: string;
  filter: (name: string) => boolean;
};

const WATCH_RULES: Array<WatchRule> = [
  {
    task: "doCreateSchema",
    dir: path.dirname(paths.createDoModuleTemplate),
    filter: (name) => name === path.basename(paths.createDoModuleTemplate),
  },
  {
    task: "doIndex",
    dir: paths.dbDoDir,
    filter: (name) =>
      name.endsWith(".ts") &&
      !name.endsWith(".gen.ts") &&
      name !== "index.ts" &&
      !name.endsWith(".d.ts"),
  },
];

export function startWatch() {
  const pending = new Set<TaskId>();
  const watchers: Array<FSWatcher> = [];
  let activeChild: ReturnType<typeof Bun.spawn> | null = null;
  const ctl = { shuttingDown: false, draining: false };

  const drain = async () => {
    if (ctl.draining || ctl.shuttingDown) return;
    ctl.draining = true;
    try {
      while (pending.size > 0) {
        const snapshot = new Set(pending);
        const task = PIPELINE.find((id) => snapshot.has(id));
        if (!task) break;

        logWatch(`→ ${task} (spawn)`);
        const child = Bun.spawn(["bun", CLI_PATH, "run", task], {
          cwd: paths.codegenRoot,
          stdout: "inherit",
          stderr: "inherit",
        });
        activeChild = child;
        const code = await child.exited;
        activeChild = null;

        if (code !== 0) {
          console.error(`[@monrep/codegen] watch spawn failed: ${task} (exit ${code})`);
        }

        for (const covered of downstreamOf(task)) {
          if (snapshot.has(covered)) pending.delete(covered);
        }
      }
    } catch (err) {
      console.error("[@monrep/codegen] watch failed:", err);
      activeChild = null;
    } finally {
      ctl.draining = false;
      if (pending.size > 0) {
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

  const enqueue = (task: TaskId) => {
    if (ctl.shuttingDown) return;
    pending.add(task);
    void debouncer.maybeExecute();
  };

  for (const rule of WATCH_RULES) {
    try {
      const watcher = watch(rule.dir, (_event, filename) => {
        if (!filename || typeof filename !== "string") return;
        const name = path.basename(filename);
        if (!rule.filter(name)) return;
        enqueue(rule.task);
      });
      watcher.on("error", (err) => {
        console.error(`[@monrep/codegen] watch error (${rule.dir}):`, err);
      });
      watchers.push(watcher);
    } catch (err) {
      console.error(`[@monrep/codegen] failed to watch ${rule.dir}:`, err);
    }
  }

  logWatch(`(${WATCH_RULES.length} dirs, debounce ${DEBOUNCE_MS}ms)`);

  return () => {
    ctl.shuttingDown = true;
    pending.clear();
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
