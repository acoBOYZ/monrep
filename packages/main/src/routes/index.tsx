import { History, MessageCirclePlus, Sparkles } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@monrep/ui/base";
import { cn } from "@monrep/utils";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: RaiHome });

function RaiHome() {
  return (
    <div className="flex h-svh min-h-0 flex-col bg-popover">
      <header
        className={cn(
          "relative flex h-13 shrink-0 items-center gap-1 border-b border-border/60 bg-card/80 px-2",
        )}
      >
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="size-7" title="History">
            <HugeiconsIcon icon={History} className="size-4 text-foreground/75" aria-hidden />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" title="New chat">
            <HugeiconsIcon
              icon={MessageCirclePlus}
              className="size-4 text-foreground/75"
              aria-hidden
            />
          </Button>
        </div>

        <div className="pointer-events-none absolute inset-x-20 top-0 flex h-13 items-center justify-center">
          <div className="flex min-w-0 items-center gap-2">
            <HugeiconsIcon icon={Sparkles} className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span className="truncate text-sm font-medium tracking-tight">monrep Via</span>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background/50 px-3 py-3">
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-sm font-medium">Start a conversation</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Agent UI for <code className="rounded bg-muted px-1 py-0.5">with-ai</code>. Shared{" "}
            <code className="rounded bg-muted px-1 py-0.5">@monrep/ui</code> tokens — ready for
            TanStack AI + Composer.
          </p>
          <Link
            to="/playground/presence"
            className="mt-3 text-sm text-primary underline-offset-4 hover:underline"
          >
            Presence playground (SSR + SSE)
          </Link>
        </div>
      </main>

      <footer className="hidden min-h-7 shrink-0 items-center border-t border-border/60 bg-card/80 px-2 md:flex" />
    </div>
  );
}
