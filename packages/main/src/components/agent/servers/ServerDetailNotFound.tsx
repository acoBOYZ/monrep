import { Alert, AlertDescription, AlertTitle, Button } from "@monrep/ui/base";
import { Link } from "@tanstack/react-router";

export function ServerDetailNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
      <Alert variant="destructive">
        <AlertTitle>Server not found</AlertTitle>
        <AlertDescription>This server id is not in the fleet list.</AlertDescription>
      </Alert>
      <Button nativeButton={false} variant="ghost" size="sm" render={<Link to="/servers" />}>
        Back to servers
      </Button>
    </main>
  );
}
