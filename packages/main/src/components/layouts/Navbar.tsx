import { useState } from "react";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, TooltipTrigger, buttonVariants } from "@monrep/ui/base";
import { cn } from "@monrep/utils";
import { Link } from "@tanstack/react-router";
import { LogoLink } from "../LogoLink";
import { SignOut } from "../SignOut";
import { ThemeToggle } from "../ThemeToggle";
import { MobileNav } from "./MobileNav";
import { getNavGroups } from "./navConfig";
import { useScrolled } from "./useScrolled";

export function Navbar() {
  const isScrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);
  const cards = getNavGroups()[0]?.cards ?? [];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-transparent transition-[background-color,border-color,backdrop-filter]",
        isScrolled || mobileOpen
          ? "border-border/60 bg-background/80 backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <LogoLink />

        <nav className="ml-2 hidden items-center gap-0.5 sm:flex" aria-label="Primary">
          {cards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              activeProps={{ className: "bg-muted [&>svg]:text-primary" }}
            >
              <HugeiconsIcon icon={card.icon} strokeWidth={2} className="size-4" />
              {card.title}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <SignOut />
          <TooltipTrigger content="Menu" className="sm:hidden">
            <Button
              type="button"
              variant="ghost"
              size="iconxs"
              className="sm:hidden"
              aria-label="Open menu"
              onClick={() => {
                setMobileOpen(true);
              }}
            >
              <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} className="size-4" />
            </Button>
          </TooltipTrigger>
        </div>
      </div>

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
    </header>
  );
}
