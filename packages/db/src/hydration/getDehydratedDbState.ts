import { DbClient } from "@tanstack/react-db";
import { DO_MODULE_DB_FACTORIES, materializeDoCollection } from "../collections";
import { ensureStream } from "../stream/ensureStream";
import { streamModuleUrl } from "../stream/paths";
import type { DehydratedDbState } from "@tanstack/react-db";
import type { AnyDoCollectionOptions } from "../collections";
import type { DoStreamDb } from "../collections/stream/types";
import type { TDoModuleId } from "../types";

export type DehydrateCtx = {
  /**
   * Catch up the descriptor's module stream and copy that collection onto the
   * request `DbClient` (for dehydrate).
   *
   * - `await preload(...)` — wait for this call before continuing the callback
   * - `void preload(...)` — start in parallel; all started preloads still finish
   *   before `dehydrate()` (SSR barrier)
   */
  preload: (options: AnyDoCollectionOptions) => Promise<void>;
};

export type GetDehydratedDbStateOptions = {
  /** Origin used to build `/_streams/<moduleId>` (e.g. `new URL(getRequest().url).origin`). */
  baseUrl: string;
};

type ModuleSession<TModule extends TDoModuleId> = {
  url: string;
  db: DoStreamDb<TModule>;
  ready: Promise<void>;
};

type ModuleSessions = {
  [TModule in TDoModuleId]?: ModuleSession<TModule>;
};

/**
 * Build a dehydrate snapshot for TanStack DB SSR.
 * Call from a route loader; pass `baseUrl` from the incoming request.
 */
export async function getDehydratedDbState(
  options: GetDehydratedDbStateOptions,
  define: (ctx: DehydrateCtx) => void | Promise<void>,
): Promise<DehydratedDbState> {
  const { baseUrl } = options;
  const dbClient = new DbClient();
  const modules: ModuleSessions = {};
  const materialized = new Set<string>();
  const pending = new Set<Promise<void>>();

  const ensureModule = async <TModule extends TDoModuleId>(
    moduleId: TModule,
  ): Promise<DoStreamDb<TModule>> => {
    const existing = modules[moduleId];
    if (existing) {
      await existing.ready;
      return existing.db;
    }

    const url = streamModuleUrl(baseUrl, moduleId);
    const handle = await ensureStream({
      url,
      contentType: "application/json",
      params: { offset: "-1" },
    });
    const db = DO_MODULE_DB_FACTORIES[moduleId]({
      stream: handle,
      // Catch-up only — do not hold SSE/long-poll on the server.
      live: false,
    });
    const ready = db.preload().catch((error: unknown) => {
      db.close();
      delete modules[moduleId];
      throw error;
    });
    const session: ModuleSession<TModule> = { url, db, ready };
    modules[moduleId] = session;
    await ready;
    return db;
  };

  const preload = (collection: AnyDoCollectionOptions): Promise<void> => {
    const task = (async () => {
      if (materialized.has(collection.id)) return;
      materialized.add(collection.id);
      await materializeDoCollection(dbClient, collection, ensureModule);
    })();
    pending.add(task);
    void task.finally(() => {
      pending.delete(task);
    });
    return task;
  };

  try {
    await define({ preload });
    if (pending.size > 0) {
      await Promise.all(pending);
    }
    return dbClient.dehydrate();
  } finally {
    for (const session of Object.values(modules)) {
      session.db.close();
    }
    await dbClient.cleanup();
  }
}
