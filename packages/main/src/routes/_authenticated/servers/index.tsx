import { Button } from "@monrep/ui/base";
import { toDateTimeAttr } from "@monrep/utils";
import { useLiveQuery } from "@tanstack/react-db";
import { Link, createFileRoute } from "@tanstack/react-router";
import type { TServerDo } from "@/db/types";
import { RevokeServerButton } from "@/components/agent/RevokeServerButton";
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Servers</h1>
          <p className="mt-2 text-sm text-cool">
            Fleet list from the agent control plane. Open a server for terminal, collectors, and
            samples.
          </p>
        </div>
        <Button nativeButton={false} render={<Link to="/servers/new" />}>
          Add server
        </Button>
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full min-w-lg text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/30 text-xs tracking-wide text-cool uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Device</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {!isReady ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-cool">
                  Connecting…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-cool">
                  No servers yet.{" "}
                  <Link
                    to="/servers/new"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Add one
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              rows.map((row) => <ServerRow key={row.id ?? row.name} server={row} />)
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

type ServerRowProps = {
  server: TServerDo;
};

const ServerRow = ({ server }: ServerRowProps) => {
  const id = server.id;
  const name = server.name;
  const status = server.status;
  const deviceId = server.deviceId ?? "—";
  const dateTime = toDateTimeAttr(server.createdAt);

  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="px-4 py-3 font-medium">
        {id ? (
          <Link
            to="/servers/$id"
            params={{ id }}
            className="text-primary underline-offset-4 hover:underline"
          >
            {name}
          </Link>
        ) : (
          name
        )}
      </td>
      <td className="px-4 py-3 capitalize">{status}</td>
      <td className="px-4 py-3 font-mono text-xs text-cool">{deviceId}</td>
      <td className="px-4 py-3 font-mono text-xs text-cool">{dateTime}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          {id ? (
            <Button
              nativeButton={false}
              render={<Link to="/servers/$id" params={{ id }} />}
              variant="outline"
              size="sm"
            >
              Open
            </Button>
          ) : null}
          {id ? <RevokeServerButton serverId={id} serverName={name} /> : null}
        </div>
      </td>
    </tr>
  );
};
