import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/servers/")({
  component: ServersPage,
});

function ServersPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">Servers</h1>
      <p className="mt-2 text-sm text-cool">
        Register, revoke, and watch your fleet. Live list arrives when control-plane streams land.
      </p>
    </main>
  );
}
