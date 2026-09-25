import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import appCss from "../tailwind.css?url";
import type { ReactNode } from "react";
import { App } from "@/App";
import { THEME_BOOTSTRAP } from "@/components/shell/themeBootstrap";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "{{name}}" },
      { name: "description", content: "{{package}} showcase Worker" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
    scripts: [{ children: THEME_BOOTSTRAP }],
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
