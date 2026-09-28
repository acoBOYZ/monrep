import { HugeiconsIcon } from "@hugeicons/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, buttonVariants } from "@monrep/ui/base";
import { cn } from "@monrep/utils";
import { Link } from "@tanstack/react-router";
import { LogoLink } from "../LogoLink";
import { getNavGroups } from "./navConfig";

type MobileNavProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const cards = getNavGroups()[0]?.cards ?? [];
  const destinations = cards.filter((card) => card.to !== "/servers/new");
  const addServer = cards.find((card) => card.to === "/servers/new");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" id="mobile-nav" className="flex w-72 flex-col overflow-hidden">
        <SheetHeader className="border-b border-border/60 pb-3">
          <SheetTitle className="sr-only">Navigate</SheetTitle>
          <LogoLink titleAs="span" />
        </SheetHeader>
        <nav
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pt-3 pb-4"
          aria-label="Mobile"
        >
          <p className="px-2 pb-1 text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
            Fleet
          </p>
          {destinations.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "w-full justify-start text-muted-foreground",
              )}
              activeProps={{ className: "bg-muted text-foreground [&>svg]:text-primary" }}
              activeOptions={{ exact: card.to !== "/servers" }}
              onClick={() => {
                onOpenChange(false);
              }}
            >
              <HugeiconsIcon icon={card.icon} strokeWidth={2} className="size-4" aria-hidden />
              {card.title}
            </Link>
          ))}
          {addServer ? (
            <>
              <div className="my-2 border-t border-border/60" />
              <Link
                to={addServer.to}
                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                <HugeiconsIcon
                  icon={addServer.icon}
                  strokeWidth={2}
                  className="size-4"
                  aria-hidden
                />
                {addServer.title}
              </Link>
            </>
          ) : null}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
