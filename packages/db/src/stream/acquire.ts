import { DurableStreamError, FetchError } from "@durable-streams/client";
import { getDoRegistry, getStreamModuleIds } from "../registry";
import { ensureStream } from "./ensureStream";
import { STREAM_EPOCH_HEADER, browserStreamUrl, moduleEpochLabel } from "./paths";
import type { DoStreamDb } from "../collections/stream/types";

type StreamSession = {
  moduleId: string;
  /** Server clock label; immortal modules use `""`. */
  epoch: string;
  db: DoStreamDb;
  ready: Promise<void>;
  refCount: number;
};

const sessions = new Map<string, StreamSession>();
const gates = new Map<string, Promise<void>>();
const epochListeners = new Map<string, Set<(epoch: string) => void>>();

export const subscribeStreamEpoch = (
  moduleId: string,
  listener: (epoch: string) => void,
): (() => void) => {
  const set = epochListeners.get(moduleId) ?? new Set();
  set.add(listener);
  epochListeners.set(moduleId, set);
  return () => {
    set.delete(listener);
    if (set.size === 0) epochListeners.delete(moduleId);
  };
};

/** Local clock guess until `x-stream-epoch` arrives. Immortal modules stay `""`. */
export const streamEpochLabel = (moduleId: string, now = new Date()): string =>
  moduleEpochLabel(moduleId, now) ?? "";

const resumeKey = (moduleId: string) => `stream-resume:${moduleId}`;

const loadOffset = (moduleId: string, epoch: string): string => {
  const raw = sessionStorage.getItem(resumeKey(moduleId));
  if (!raw) return "-1";
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "offset" in parsed &&
      typeof parsed.offset === "string" &&
      "epoch" in parsed &&
      parsed.epoch === epoch
    ) {
      return parsed.offset;
    }
  } catch (error) {
    console.error("[StreamDb] resume offset unreadable", error);
  }
  return "-1";
};

const saveOffset = (moduleId: string, epoch: string, offset: string): void => {
  sessionStorage.setItem(resumeKey(moduleId), JSON.stringify({ offset, epoch }));
};

const clearOffset = (moduleId: string, epoch: string): void => {
  sessionStorage.setItem(resumeKey(moduleId), JSON.stringify({ offset: "-1", epoch }));
};

const isGoneError = (error: Error): boolean => {
  if (error instanceof FetchError) return error.status === 410 || error.status === 404;
  if (error instanceof DurableStreamError) {
    return error.status === 410 || error.status === 404 || error.code === "NOT_FOUND";
  }
  return false;
};

const withGate = <T>(moduleId: string, fn: () => Promise<T>): Promise<T> => {
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

const waitMacrotask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const sameSession = (moduleId: string, epoch: string): boolean => {
  const session = sessions.get(moduleId);
  return Boolean(session && session.epoch === epoch);
};

const openSession = async (moduleId: string, epoch: string): Promise<StreamSession> => {
  const { persist, factories } = getDoRegistry();
  const modulePersist = persist[moduleId] ?? false;
  const factory = factories[moduleId];
  if (!factory) {
    throw new Error(
      `@monrep/db: unknown DO module "${moduleId}" (not in bound registry.factories)`,
    );
  }

  let liveOffset: string | undefined;
  const handle = await ensureStream({
    url: browserStreamUrl(moduleId),
    contentType: "application/json",
    fetch: ((input, init) =>
      fetch(input, init).then((response) => {
        const headerEpoch = response.headers.get(STREAM_EPOCH_HEADER);
        if (headerEpoch && headerEpoch !== epoch) {
          epochListeners.get(moduleId)?.forEach((listener) => listener(headerEpoch));
        }
        const method = (typeof init?.method === "string" ? init.method : "GET").toUpperCase();
        if (method === "GET") {
          const nextOffset = response.headers.get("stream-next-offset");
          if (nextOffset) liveOffset = nextOffset;
        }
        return response;
      })) as typeof fetch,
    params: {
      offset: () => liveOffset ?? (modulePersist ? loadOffset(moduleId, epoch) : "-1"),
    },
    onError: (error) => {
      if (!isGoneError(error)) return;
      liveOffset = undefined;
      if (modulePersist) clearOffset(moduleId, epoch);
      return { params: { offset: "-1" } };
    },
  });

  const db = factory({
    stream: handle,
    onBeforeBatch(batch) {
      const flat = flattenPoisonedBatchItems(batch.items);
      if (!flat) return;
      const mutable = batch.items as unknown as Array<unknown>;
      mutable.splice(0, mutable.length, ...flat);
    },
    onBatch(batch) {
      if (modulePersist) saveOffset(moduleId, epoch, batch.offset);
    },
  });

  const next: StreamSession = {
    moduleId,
    epoch,
    db,
    ready: Promise.resolve(),
    refCount: 0,
  };

  next.ready = db
    .preload()
    .then(() => undefined)
    .catch((error: unknown) => {
      if (sessions.get(moduleId) === next) {
        sessions.delete(moduleId);
        db.close();
      }
      throw error;
    });

  sessions.set(moduleId, next);
  return next;
};

const acquireInner = async (moduleId: string, epoch: string): Promise<StreamSession> => {
  const current = sessions.get(moduleId);
  if (sameSession(moduleId, epoch) && current) {
    current.refCount += 1;
    await current.ready;
    return current;
  }

  while (sessions.get(moduleId) && !sameSession(moduleId, epoch)) {
    const stale = sessions.get(moduleId);
    if (stale && stale.refCount > 0) {
      await waitMacrotask();
      continue;
    }
    stale?.db.close();
    sessions.delete(moduleId);
  }

  const reused = sessions.get(moduleId);
  if (sameSession(moduleId, epoch) && reused) {
    reused.refCount += 1;
    await reused.ready;
    return reused;
  }

  const next = await openSession(moduleId, epoch);
  next.refCount += 1;
  await next.ready;
  return next;
};

/** Acquire (or reuse) a module StreamDB. Survives React StrictMode remount. */
export const acquireStreamModule = (moduleId: string, epoch: string): Promise<StreamSession> =>
  withGate(moduleId, () => acquireInner(moduleId, epoch));

/**
 * Release a ref. Close is deferred one macrotask so StrictMode's
 * cleanup→remount can re-acquire without tearing down the live consumer.
 */
export const releaseStreamModule = (moduleId: string, epoch: string): void => {
  const session = sessions.get(moduleId);
  if (!session || !sameSession(moduleId, epoch)) return;
  session.refCount -= 1;
  if (session.refCount > 0) return;

  setTimeout(() => {
    if (sessions.get(moduleId) !== session || session.refCount > 0) return;
    session.db.close();
    sessions.delete(moduleId);
  }, 0);
};

/** Bound registry module ids. Call after `bindDoRegistry`. */
export const getStreamModuleIdList = getStreamModuleIds;
