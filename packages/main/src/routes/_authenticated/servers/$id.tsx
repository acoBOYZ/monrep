import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SessionWsProvider } from "@/components/agent/session-ws/SessionWsProvider";

export const Route = createFileRoute("/_authenticated/servers/$id")({
  component: ServerIdLayout,
});

function ServerIdLayout() {
  const { id } = Route.useParams();
  return (
    <SessionWsProvider serverId={id}>
      <Outlet />
    </SessionWsProvider>
  );
}
