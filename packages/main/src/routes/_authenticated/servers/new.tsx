import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/servers/new")({
  component: NewServerPage,
});

function NewServerPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">Add server</h1>
      <p className="mt-2 text-sm text-cool">
        Connect a new agent / machine. Install flow and tokens come next.
      </p>
      <p className="mt-6">
        <Link
          to="/servers"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to servers
        </Link>
      </p>
    </main>
  );
}
