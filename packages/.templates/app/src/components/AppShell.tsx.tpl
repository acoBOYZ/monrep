import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SignOut } from "@/components/SignOut";

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <span className="font-semibold tracking-tight">{{name}}</span>
          <Link
            to="/playground/streams"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Streams
          </Link>
          <Link
            to="/playground/presence"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Presence
          </Link>
        </nav>
        <SignOut />
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
