import { useState } from "react";
import { toast } from "@monrep/ui/base";
import { tryCatch } from "@monrep/utils";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { DEFAULT_ORDER, normalizeOrder } from "./sectionIds";
import type { ServerSectionId } from "./sectionIds";
import { useStreamDb } from "@/db/useStreamDb";

function sameOrder(a: ReadonlyArray<ServerSectionId>, b: ReadonlyArray<ServerSectionId>): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

export function useServerLayout(serverId: string) {
  const { db, isReady } = useStreamDb("agent");
  const { data: row } = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q
        .from({ l: db.collections.server_layout })
        .where(({ l }) => eq(l.serverId, serverId))
        .findOne();
    },
  });

  const remote = row?.sections ? normalizeOrder(row.sections) : DEFAULT_ORDER;
  const [optimistic, setOptimistic] = useState<Array<ServerSectionId> | null>(null);
  const order = optimistic != null && !sameOrder(optimistic, remote) ? optimistic : remote;

  const setOrder = (next: ReadonlyArray<ServerSectionId>) => {
    if (!db) {
      toast.error("Stream not ready");
      return;
    }
    const sections = normalizeOrder(next);
    setOptimistic(sections);
    void (async () => {
      const { error } = await tryCatch(
        db.actions.upsertServerLayout({ serverId, sections }).when("settled"),
      );
      if (error) {
        setOptimistic(null);
        toast.error(error instanceof Error ? error.message : "Layout save failed");
      }
    })();
  };

  return { order, setOrder, isReady };
}
