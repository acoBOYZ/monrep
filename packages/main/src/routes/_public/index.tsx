import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/")({
  component: PublicHome,
});

function PublicHome() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 text-foreground">
      <p className="text-2xl font-semibold tracking-tight">monrep</p>
      <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
        Control plane. Sign in at{" "}
        <Link to="/admin" className="text-foreground underline-offset-4 hover:underline">
          /admin
        </Link>
        .
      </p>
    </main>
  );
}
