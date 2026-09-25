import { tryCatch } from "@monrep/utils";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/server/auth/functions";
import { DEFAULT_AUTH_REDIRECT } from "@/server/auth/schemas";

export const Route = createFileRoute("/_public")({
  beforeLoad: async () => {
    const { data: session } = await tryCatch(getSession());
    if (session) {
      redirect({ to: DEFAULT_AUTH_REDIRECT, throw: true });
    }
  },
  component: PublicLayout,
});

function PublicLayout() {
  return <Outlet />;
}
