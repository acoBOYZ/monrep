import { DurableStreamError, FetchError } from "@durable-streams/client";
import { DO_MODULE_DB_FACTORIES } from "../collections";
import { DO_MODULE_PERSIST } from "../do";
import { ensureStream } from "./ensureStream";
import { browserStreamUrl } from "./paths";
import type { DoStreamDb } from "../collections/stream/types";
import type { TDoModuleId } from "../types";

type StreamSession<TModule extends TDoModuleId = TDoModuleId> = {
  moduleId: TModule;
  db: DoStreamDb<TModule>;
  ready: Promise<void>;
  refCount: number;
};

const sessions = new Map<TDoModuleId, StreamSession>();
const gates = new Map<TDoModuleId, Promise<void>>();

const resumeKey = (moduleId: string) => `stream-resume:${moduleId}`;

const loadOffset = (moduleId: string): string => {
  const raw = sessionStorage.getItem(resumeKey(moduleId));
  if (!raw) return "-1";
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "offset" in parsed &&
      typeof parsed.offset === "string"
    ) {
      return parsed.offset;
    }
  } catch (error) {
    console.error("[StreamDb] resume offset unreadable", error);
  }
  return "-1";
};

const saveOffset = (moduleId: string, offset: string): void => {
  sessionStorage.setItem(resumeKey(moduleId), JSON.stringify({ offset }));
};

const clearOffset = (moduleId: string): void => {
  sessionStorage.setItem(resumeKey(moduleId), JSON.stringify({ offset: "-1" }));
};

const isGoneError = (error: Error): boolean => {
  if (error instanceof FetchError) return error.status === 410 || error.status === 404;
  if (error instanceof DurableStreamError) {
    return error.status === 410 || error.status === 404 || error.code === "NOT_FOUND";
  }
  return false;
};

const withGate = <T>(moduleId: TDoModuleId, fn: () => Promise<T>): Promise<T> => {
  const prev = gates.get(moduleId) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  gates.set(
    moduleId,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
};

/** One-level flatten for legacy `[[event]]` appends that broke `isChangeEvent`. */
const flattenPoisonedBatchItems = (items: ReadonlyArray<unknown>): Array<unknown> | null => {
  if (!items.some((item) => Array.isArray(item))) return null;
  return items.flatMap((item) => (Array.isArray(item) ? (item as Array<unknown>) : [item]));
};

const openSession = async <TModule extends TDoModuleId>(
  moduleId: TModule,
): Promise<StreamSession<TModule>> => {
  const persist = DO_MODULE_PERSIST[moduleId];
  let liveOffset: string | undefined;
  const handle = await ensureStream({
    url: browserStreamUrl(moduleId),
    contentType: "application/json",
    fetch: ((input, init) =>
      fetch(input, init).then((response) => {
        const method = (typeof init?.method === "string" ? init.method : "GET").toUpperCase();
        if (method === "GET") {
          const nextOffset = response.headers.get("stream-next-offset");
          if (nextOffset) liveOffset = nextOffset;
        }
        return response;
      })) as typeof fetch,
    params: {
      offset: () => liveOffset ?? (persist ? loadOffset(moduleId) : "-1"),
    },
    onError: (error) => {
      if (!isGoneError(error)) return;
      liveOffset = undefined;
      if (persist) clearOffset(moduleId);
      return { params: { offset: "-1" } };
    },
  });

  const db = DO_MODULE_DB_FACTORIES[moduleId]({
    stream: handle,
    onBeforeBatch(batch) {
      const flat = flattenPoisonedBatchItems(batch.items);
      if (!flat) return;
      const mutable = batch.items as unknown as Array<unknown>;
      mutable.splice(0, mutable.length, ...flat);
    },
    onBatch(batch) {
      if (persist) saveOffset(moduleId, batch.offset);
    },
  });

  const next = {
    moduleId,
    db,
    ready: Promise.resolve(),
    refCount: 0,
  } as StreamSession<TModule>;

  next.ready = db.preload().catch((error: unknown) => {
    if (sessions.get(moduleId) === next) {
      sessions.delete(moduleId);
      db.close();
    }
    throw error;
  });

  sessions.set(moduleId, next);
  return next;
};

const acquireInner = async <TModule extends TDoModuleId>(
  moduleId: TModule,
): Promise<StreamSession<TModule>> => {
  const current = sessions.get(moduleId);
  if (current) {
    current.refCount += 1;
    await current.ready;
    return current as StreamSession<TModule>;
  }

  const next = await openSession(moduleId);
  next.refCount += 1;
  await next.ready;
  return next;
};

/** Acquire (or reuse) a module StreamDB. Survives React StrictMode remount. */
export const acquireStreamModule = <TModule extends TDoModuleId>(
  moduleId: TModule,
): Promise<StreamSession<TModule>> => withGate(moduleId, () => acquireInner(moduleId));

/**
 * Release a ref. Close is deferred one macrotask so StrictMode's
 * cleanup→remount can re-acquire without tearing down the live consumer.
 */
export const releaseStreamModule = (moduleId: TDoModuleId): void => {
  const session = sessions.get(moduleId);
  if (!session) return;
  session.refCount -= 1;
  if (session.refCount > 0) return;

  setTimeout(() => {
    if (sessions.get(moduleId) !== session || session.refCount > 0) return;
    session.db.close();
    sessions.delete(moduleId);
  }, 0);
};

export const STREAM_MODULE_IDS = Object.keys(DO_MODULE_DB_FACTORIES) as Array<TDoModuleId>;
