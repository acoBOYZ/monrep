import { createFileRoute } from "@tanstack/react-router";
import { MarketingHome } from "@/components/landing/MarketingHome";

export const Route = createFileRoute("/_public/")({
  component: PublicHome,
});

function PublicHome() {
  return <MarketingHome />;
}
