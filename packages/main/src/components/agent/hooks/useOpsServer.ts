import { eq, useLiveQuery } from "@tanstack/react-db";
import { useStreamDb } from "@/db/useStreamDb";

export function useOpsServer(serverId: string) {
  const { db, isReady } = useStreamDb("agent");
  const { data: server } = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q
        .from({ s: db.collections.server })
        .where(({ s }) => eq(s.id, serverId))
        .findOne();
    },
  });

  return {
    server,
    isReady,
    online: server?.status === "online",
  };
}
