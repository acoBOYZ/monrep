import { Link } from "@tanstack/react-router";
import { RevokeServerButton } from "@/components/agent/RevokeServerButton";

type PendingServerPanelProps = {
  serverId: string;
  name: string;
  createdAt?: string;
};

export function PendingServerPanel({ serverId, name, createdAt }: PendingServerPanelProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/servers" className="text-xs text-cool underline-offset-4 hover:underline">
        ← Servers
      </Link>
      <div className="mt-6 max-w-xl">
        <p className="text-xs font-medium tracking-wide text-cool uppercase">Pending</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{name}</h1>
        <p className="mt-3 text-sm text-cool">
          This server is waiting to be bound. Run the enroll command on the host with the onetime
          token shown when you created it. The token is not shown again here.
        </p>
        <dl className="mt-6 grid gap-2 text-sm text-cool">
          <div>
            Server id: <span className="font-mono text-xs text-foreground">{serverId}</span>
          </div>
          {createdAt ? (
            <div>
              Created:{" "}
              <span className="font-mono text-xs text-foreground">{createdAt.slice(0, 19)}</span>
            </div>
          ) : null}
          <div>
            Status: <span className="text-foreground capitalize">pending</span>
          </div>
        </dl>
        <p className="mt-6 text-sm text-cool">
          On the host:{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">monrep enroll …</code> then{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">monrep daemon</code>
        </p>
        <div className="mt-8">
          <RevokeServerButton serverId={serverId} serverName={name} redirectToList />
        </div>
      </div>
    </main>
  );
}
