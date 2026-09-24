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
    pathParamsAllowedCharacters: [";", ":", "@", "&", "=", "+", "$"],
    scrollRestoration: true,
    scrollRestorationBehavior: "auto",
    defaultHashScrollIntoView: { behavior: "smooth" },
    routeMasks: [],
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
