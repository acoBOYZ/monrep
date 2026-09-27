import { useState, useTransition } from "react";
import { Button, CopyableButton } from "@monrep/ui/base";
import { tryCatch } from "@monrep/utils";
import { Link, createFileRoute } from "@tanstack/react-router";
import type { SubmitEvent } from "react";
import { createFleetServerFn } from "@/server/agent/functions";

export const Route = createFileRoute("/_authenticated/servers/new")({
  component: NewServerPage,
});

function NewServerPage() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enrollToken, setEnrollToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [serverId, setServerId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const controlUrl = typeof window !== "undefined" ? window.location.origin : "";
  const enrollCommand =
    enrollToken && controlUrl ? `monrep enroll --url ${controlUrl} --token ${enrollToken}` : "";

  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const { data, error: err } = await tryCatch(createFleetServerFn({ data: { name } }));
      if (err) {
        setError(err instanceof Error ? err.message : "Failed to create server");
        return;
      }
      setServerId(data.server.id ?? null);
      setEnrollToken(data.enrollToken);
      setExpiresAt(data.expiresAt);
    });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">Add server</h1>
      <p className="mt-2 text-sm text-cool">
        Mint a one-time enroll token, then run the command on the host. The agent dials out to this
        app only (1:1).
      </p>

      {!enrollToken ? (
        <form onSubmit={onSubmit} className="mt-8 flex max-w-md flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Server name</span>
            <input
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="prod-edge-1"
              autoComplete="off"
            />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending || name.trim().length === 0}>
              {pending ? "Creating…" : "Create & mint token"}
            </Button>
            <Link to="/servers" className="text-sm text-cool underline-offset-4 hover:underline">
              Cancel
            </Link>
          </div>
        </form>
      ) : (
        <div className="mt-8 flex max-w-2xl flex-col gap-4">
          <p className="text-sm text-cool">
            Server <span className="font-mono text-foreground">{serverId}</span> created. Token
            expires {expiresAt?.slice(0, 19) ?? "soon"} UTC. Copy once. It is not shown again.
          </p>
          <CopyableButton
            text={enrollCommand}
            variant="block"
            className="overflow-hidden rounded-lg border border-border bg-muted/40"
          >
            <pre className="min-w-0 flex-1 overflow-x-auto p-3 pr-12 font-mono text-sm leading-relaxed">
              <code>{enrollCommand}</code>
            </pre>
          </CopyableButton>
          <p className="text-sm text-cool">
            Then on the host:{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">monrep daemon</code>
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {serverId ? (
              <Link
                to="/servers/$id"
                params={{ id: serverId }}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                View pending server
              </Link>
            ) : null}
            <Link
              to="/servers"
              className="text-sm font-medium text-cool underline-offset-4 hover:underline"
            >
              Back to servers
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
