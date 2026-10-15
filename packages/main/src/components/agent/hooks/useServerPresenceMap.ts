import { useMemo } from "react";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { useStreamDb } from "@/db/useStreamDb";

const EMPTY: ReadonlyMap<string, string> = new Map();

/** serverId → lastSeenAt from epoched `agent_presence` (not immortal `agent.server`). */
export function useServerPresenceMap(): {
  lastSeenByServerId: ReadonlyMap<string, string>;
  isReady: boolean;
} {
  const { db, isReady } = useStreamDb("agent_presence");
  const { data: rows = [] } = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q.from({ p: db.collections.presence });
    },
  });

  const lastSeenByServerId = useMemo(() => {
    if (!isReady) return EMPTY;
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.serverId && row.lastSeenAt) map.set(row.serverId, row.lastSeenAt);
    }
    return map;
  }, [isReady, rows]);

  return { lastSeenByServerId, isReady };
}

export function useServerLastSeenAt(serverId: string): string | undefined {
  const { db, isReady } = useStreamDb("agent_presence");
  const { data: row } = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q
        .from({ p: db.collections.presence })
        .where(({ p }) => eq(p.serverId, serverId))
        .findOne();
    },
  });
  if (!isReady) return undefined;
  return typeof row?.lastSeenAt === "string" ? row.lastSeenAt : undefined;
}
