import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { ErrorState } from "./components/pages/ErrorState";
import { NotFound } from "./components/pages/NotFound";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    defaultErrorComponent: ErrorState,
    defaultNotFoundComponent: NotFound,
    defaultStructuralSharing: true,
    defaultViewTransition: false,
    defaultPreload: "intent",
    scrollRestoration: true,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
