import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import appCss from "../tailwind.css?url";
import type { ReactNode } from "react";
import { App } from "@/App";

export const Route = createRootRoute({
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
  return (
    <App>
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
