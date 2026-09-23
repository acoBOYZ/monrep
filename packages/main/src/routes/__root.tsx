import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import appCss from "../tailwind.css?url";
import type { ReactNode } from "react";
import { App } from "@/App";
import { getRootDehydratedDbState } from "@/server/getRootDehydratedDbState";

export const Route = createRootRoute({
  loader: async () => {
    const dehydratedDbState = await getRootDehydratedDbState();
    return { dehydratedDbState };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "monrep Rai" },
      {
        name: "description",
        content: "monrep agent surface — embeddable in the web app AI panel.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
});

function RootComponent() {
  const { dehydratedDbState } = Route.useLoaderData();

  return (
    <App dehydratedDbState={dehydratedDbState}>
      <Outlet />
    </App>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
