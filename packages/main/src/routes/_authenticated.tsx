import { useStreamsReady } from "@monrep/db/stream";
import { tryCatch } from "@monrep/utils";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { Navbar } from "@/components/layouts/Navbar";
import { PageLoader } from "@/components/pages/PageLoader";
import { DOHost } from "@/db/host";
import { requireSession } from "@/server/auth/functions";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data: session, error } = await tryCatch(requireSession());
    if (error) {
      redirect({
        to: "/admin",
        search: {
          redirect: location.pathname + (location.searchStr ? location.searchStr : ""),
        },
        throw: true,
      });
    }
    return { session };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const streamsReady = useStreamsReady();

  return (
    <>
      <DOHost />
      {streamsReady ? (
        <Navbar>
          <Outlet />
        </Navbar>
      ) : (
        <PageLoader />
      )}
    </>
  );
}
