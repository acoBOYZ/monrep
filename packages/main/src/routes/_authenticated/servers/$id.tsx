import { eq, useLiveQuery } from "@tanstack/react-db";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AgentTerminal } from "@/components/agent/AgentTerminal";
import { AgentUpdateSettings } from "@/components/agent/AgentUpdateSettings";
import { CollectorsSettings } from "@/components/agent/CollectorsSettings";
import { PendingServerPanel } from "@/components/agent/PendingServerPanel";
import { RevokeServerButton } from "@/components/agent/RevokeServerButton";
import { SamplePanels } from "@/components/agent/SamplePanels";
import { useStreamDb } from "@/db/useStreamDb";

export const Route = createFileRoute("/_authenticated/servers/$id")({
  component: ServerDetailPage,
});

function ServerDetailPage() {
  const { id } = Route.useParams();
  const { db, isReady } = useStreamDb("agent");
  const live = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q
        .from({ s: db.collections.server })
        .where(({ s }) => eq(s.id, id))
        .findOne();
    },
  });
  const server = live.data;

  if (!isReady) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-sm text-cool">Connecting…</p>
      </main>
    );
  }

  if (!server) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-sm text-cool">Server not found.</p>
        <Link
          to="/servers"
          className="mt-4 inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          Back to servers
        </Link>
      </main>
    );
  }

  if (server.status === "pending") {
    return <PendingServerPanel serverId={id} name={server.name} createdAt={server.createdAt} />;
  }

  const online = server.status === "online";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/servers" className="text-xs text-cool underline-offset-4 hover:underline">
            ← Servers
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">{server.name}</h1>
          <dl className="mt-3 grid gap-1 text-sm text-cool sm:grid-cols-2">
            <div>
              Status: <span className="text-foreground capitalize">{server.status}</span>
            </div>
            <div>
              Device:{" "}
              <span className="font-mono text-xs text-foreground">{server.deviceId ?? "—"}</span>
            </div>
            <div>
              Last seen:{" "}
              <span className="font-mono text-xs text-foreground">
                {server.lastSeenAt?.slice(0, 19) ?? "—"}
              </span>
            </div>
            <div>
              Agent:{" "}
              <span className="font-mono text-xs text-foreground">
                {server.agentVersion ?? "—"}
              </span>
            </div>
          </dl>
        </div>
        <RevokeServerButton serverId={id} serverName={server.name} redirectToList />
      </div>

      <AgentTerminal serverId={id} online={online} />
      <AgentUpdateSettings serverId={id} online={online} />
      <CollectorsSettings serverId={id} />
      <SamplePanels serverId={id} />
    </main>
  );
}
