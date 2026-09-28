import { HugeiconsIcon } from "@hugeicons/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, buttonVariants } from "@monrep/ui/base";
import { cn } from "@monrep/utils";
import { Link } from "@tanstack/react-router";
import { getNavGroups } from "./navConfig";

type MobileNavProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const cards = getNavGroups()[0]?.cards ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-72 flex-col overflow-hidden">
        <SheetHeader>
          <SheetTitle className="sr-only">Navigate</SheetTitle>
        </SheetHeader>
        <nav
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pt-2 pb-4"
          aria-label="Mobile"
        >
          {cards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start")}
              activeProps={{ className: "bg-muted" }}
              activeOptions={{ exact: card.to !== "/servers" }}
              onClick={() => {
                onOpenChange(false);
              }}
            >
              <HugeiconsIcon icon={card.icon} strokeWidth={2} className="size-4" />
              {card.title}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
