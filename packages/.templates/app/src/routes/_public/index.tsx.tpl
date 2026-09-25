import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_AUTH_REDIRECT } from "@/server/auth/schemas";

export const Route = createFileRoute("/_public/")({
  beforeLoad: () => {
    redirect({ to: "/login", throw: true });
  },
  component: PublicHome,
});

function PublicHome() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 text-foreground">
      <p className="text-2xl font-semibold tracking-tight">{{name}}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        <Link to="/login" className="underline-offset-4 hover:underline">
          Sign in
        </Link>{" "}
        → {DEFAULT_AUTH_REDIRECT}
      </p>
    </main>
  );
}
