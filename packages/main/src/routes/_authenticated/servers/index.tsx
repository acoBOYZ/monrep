import { AddSquareIcon, DashboardCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge, Button } from "@monrep/ui/base";
import { useLiveQuery } from "@tanstack/react-db";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ServersTable } from "@/components/agent/servers/ServersTable";
import { useStreamDb } from "@/db/useStreamDb";

export const Route = createFileRoute("/_authenticated/servers/")({
  component: ServersPage,
});

function ServersPage() {
  const { db, isReady } = useStreamDb("agent");

  const { data: rows = [] } = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q.from({ s: db.collections.server }).orderBy(({ s }) => s.createdAt, "desc");
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight">Servers</h1>
          <Badge variant="muted">{rows.length}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            render={<Link to="/dashboard" />}
          >
            <HugeiconsIcon icon={DashboardCircleIcon} className="size-4" />
            Dashboard
          </Button>
          <Button nativeButton={false} size="sm" render={<Link to="/servers/new" />}>
            <HugeiconsIcon icon={AddSquareIcon} className="size-4" />
            Add server
          </Button>
        </div>
      </div>
      <ServersTable rows={rows} isReady={isReady} />
    </main>
  );
}
