import { createFileRoute } from "@tanstack/react-router";
import { FleetDashboardPage } from "@/components/agent/dashboard/FleetDashboardPage";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: FleetDashboardPage,
});
