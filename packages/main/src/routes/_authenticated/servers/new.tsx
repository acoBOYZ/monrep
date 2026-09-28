import { Button } from "@monrep/ui/base";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useCreateServer } from "@/components/agent/hooks/useCreateServer";
import { EnrollTokenResult } from "@/components/agent/servers/EnrollTokenResult";
import { NewServerForm } from "@/components/agent/servers/NewServerForm";

export const Route = createFileRoute("/_authenticated/servers/new")({
  component: NewServerPage,
});

function NewServerPage() {
  const { name, setName, pending, error, result, submitCreateServer } = useCreateServer();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold tracking-tight">Add server</h1>
        <Button nativeButton={false} variant="ghost" size="sm" render={<Link to="/servers" />}>
          Cancel
        </Button>
      </div>
      {result ? (
        <EnrollTokenResult
          serverId={result.serverId}
          enrollToken={result.enrollToken}
          expiresAt={result.expiresAt}
        />
      ) : (
        <NewServerForm
          name={name}
          pending={pending}
          error={error}
          onNameChange={setName}
          onSubmit={submitCreateServer}
        />
      )}
    </main>
  );
}
