import { createFileRoute } from "@tanstack/react-router";
import { ServerDetailPage } from "@/components/agent/servers/ServerDetailPage";

export const Route = createFileRoute("/_authenticated/servers/$id/")({
  component: ServerDetailIndex,
});

function ServerDetailIndex() {
  const { id } = Route.useParams();
  return <ServerDetailPage serverId={id} />;
}
