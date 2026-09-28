import { and, eq, inArray, lt, queryOnce } from "@tanstack/react-db";
import type { TSampleDo } from "@/db/types";
import type { AgentLiveDb } from "@/server/agent/db";

/** Drop `other` samples older than this. */
export const OTHER_MAX_AGE_MS = 30 * 60 * 1000;
/** Drop monitor/error/overload/health samples older than this. */
export const RETAIN_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const PRUNE_BATCH = 200;
export const PRUNE_RETRY_DELAY_MS = 5_000;

const RETAIN_KINDS = ["monitor", "error", "overload", "health"] as const;

async function listOldSamplesByKind(
  db: AgentLiveDb,
  serverId: string,
  kind: string,
  olderThanIso: string,
  limit: number,
): Promise<Array<TSampleDo>> {
  return queryOnce({
    query: (q) =>
      q
        .from({ s: db.collections.sample })
        .where(({ s }) => and(eq(s.serverId, serverId), eq(s.kind, kind), lt(s.at, olderThanIso)))
        .orderBy(({ s }) => s.at, "asc")
        .limit(limit),
  });
}

async function listOldSamplesByKinds(
  db: AgentLiveDb,
  serverId: string,
  kinds: ReadonlyArray<string>,
  olderThanIso: string,
  limit: number,
): Promise<Array<TSampleDo>> {
  return queryOnce({
    query: (q) =>
      q
        .from({ s: db.collections.sample })
        .where(({ s }) =>
          and(eq(s.serverId, serverId), inArray(s.kind, [...kinds]), lt(s.at, olderThanIso)),
        )
        .orderBy(({ s }) => s.at, "asc")
        .limit(limit),
  });
}

export type PruneResult = { deleted: number; hasMore: boolean };

/** Delete aged samples for one server; capped per alarm tick. */
export async function pruneServerSamples(
  db: AgentLiveDb,
  serverId: string,
  nowMs = Date.now(),
): Promise<PruneResult> {
  const otherCutoff = new Date(nowMs - OTHER_MAX_AGE_MS).toISOString();
  const retainCutoff = new Date(nowMs - RETAIN_MAX_AGE_MS).toISOString();

  const [otherRows, retainRows] = await Promise.all([
    listOldSamplesByKind(db, serverId, "other", otherCutoff, PRUNE_BATCH),
    listOldSamplesByKinds(db, serverId, RETAIN_KINDS, retainCutoff, PRUNE_BATCH),
  ]);

  const ids = [...otherRows, ...retainRows]
    .map((row) => row.id)
    .filter((id): id is string => Boolean(id))
    .slice(0, PRUNE_BATCH);

  if (ids.length > 0) {
    await db.actions.deleteSample(ids).isPersisted.promise;
  }

  const hasMore =
    otherRows.length === PRUNE_BATCH ||
    retainRows.length === PRUNE_BATCH ||
    otherRows.length + retainRows.length > PRUNE_BATCH;

  return { deleted: ids.length, hasMore };
}
