import { useState } from "react";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, Separator, TooltipTrigger, buttonVariants } from "@monrep/ui/base";
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
  const destinations = cards.filter((card) => card.to !== "/servers/new");
  const addServer = cards.find((card) => card.to === "/servers/new");

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter]",
        isScrolled || mobileOpen
          ? "border-border/60 bg-background/80 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <LogoLink />

        <nav
          className="ms-1 hidden min-w-0 items-center gap-0.5 rounded-lg bg-muted/40 p-0.5 sm:flex"
          aria-label="Primary"
        >
          {destinations.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              activeOptions={{ exact: card.to !== "/servers" }}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-foreground",
              )}
              activeProps={{
                className: "bg-background text-foreground shadow-xs [&>svg]:text-primary",
              }}
            >
              <HugeiconsIcon icon={card.icon} strokeWidth={2} className="size-4" aria-hidden />
              {card.title}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1">
          {addServer ? (
            <Button
              nativeButton={false}
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              render={<Link to={addServer.to} />}
            >
              <HugeiconsIcon icon={addServer.icon} strokeWidth={2} className="size-4" aria-hidden />
              {addServer.title}
            </Button>
          ) : null}
          <Separator
            orientation="vertical"
            className="mx-1 my-0 hidden data-[orientation=vertical]:h-5 sm:block"
          />
          <ThemeToggle />
          <SignOut />
          <TooltipTrigger content="Menu" className="sm:hidden">
            <Button
              type="button"
              variant="ghost"
              size="iconxs"
              className="sm:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => {
                setMobileOpen(true);
              }}
            >
              <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} className="size-4" aria-hidden />
            </Button>
          </TooltipTrigger>
        </div>
      </div>

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
    </header>
  );
}
