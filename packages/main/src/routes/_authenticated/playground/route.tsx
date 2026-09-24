import { tryCatch } from "@monrep/utils";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { requireCapability } from "@/server/auth/functions";

export const Route = createFileRoute("/_authenticated/playground")({
  beforeLoad: async () => {
    const { error } = await tryCatch(requireCapability({ data: { capability: "playground" } }));
    if (error) redirect({ to: "/admin", throw: true });
  },
  component: () => <Outlet />,
});
