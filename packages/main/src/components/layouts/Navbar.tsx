import { useEffect, useState } from "react";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Button,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@monrep/ui/base";
import { cn } from "@monrep/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { LogoLink } from "../LogoLink";
import { SignOut } from "../SignOut";
import { ThemeToggle } from "../ThemeToggle";
import { getNavGroups } from "./navConfig";
import type { ReactNode } from "react";
import type { NavCard } from "./navConfig";

type NavbarProps = {
  children: ReactNode;
};

function NavCardLink({ card, onNavigate }: { card: NavCard; onNavigate?: () => void }) {
  return (
    <NavigationMenuLink
      render={<Link to={card.to} onClick={onNavigate} />}
      className="flex w-full items-start gap-3 rounded-md p-3 hover:bg-muted focus:bg-muted"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-foreground">
        <HugeiconsIcon icon={card.icon} strokeWidth={2} className="size-5 text-cool" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-sm font-medium text-foreground">{card.title}</span>
        <span className="mt-0.5 block text-sm leading-snug text-cool">{card.description}</span>
      </span>
    </NavigationMenuLink>
  );
}

export function Navbar({ children }: NavbarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const mobileMenuOpen = menuOpen && menuPath === pathname;
  const navGroups = getNavGroups();

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  const openMobileMenu = () => {
    setMenuPath(pathname);
    setMenuOpen(true);
  };

  const closeMobileMenu = () => setMenuOpen(false);

  const toggleMobileMenu = () => {
    if (mobileMenuOpen) closeMobileMenu();
    else openMobileMenu();
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b border-transparent transition-[background-color,border-color,backdrop-filter]",
          isScrolled || mobileMenuOpen
            ? "border-border/60 bg-background/80 backdrop-blur-md"
            : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <LogoLink />

          <div className="ml-2 hidden sm:block">
            <NavigationMenu delay={0}>
              <NavigationMenuList>
                {navGroups.map((group) => (
                  <NavigationMenuItem key={group.id}>
                    <NavigationMenuTrigger>{group.label}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[min(100vw-2rem,22rem)] gap-1 p-1">
                        {group.cards.map((card) => (
                          <li key={card.to}>
                            <NavCardLink card={card} />
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <SignOut />
            <Button
              type="button"
              variant="ghost"
              size="iconxs"
              className="sm:hidden"
              aria-expanded={mobileMenuOpen}
              aria-controls="authenticated-mobile-nav"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={toggleMobileMenu}
            >
              <HugeiconsIcon
                icon={mobileMenuOpen ? Cancel01Icon : Menu01Icon}
                strokeWidth={2}
                className="size-4"
              />
            </Button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <nav
            id="authenticated-mobile-nav"
            className="border-t border-border/60 px-4 py-3 sm:hidden"
            aria-label="Mobile"
          >
            <div className="flex flex-col gap-4">
              {navGroups.map((group) => (
                <div key={group.id}>
                  <p className="mb-1 px-1 text-xs font-medium tracking-wide text-cool uppercase">
                    {group.label}
                  </p>
                  <ul className="flex flex-col gap-1">
                    {group.cards.map((card) => (
                      <li key={card.to}>
                        <Link
                          to={card.to}
                          onClick={closeMobileMenu}
                          className="flex items-start gap-3 rounded-md p-2 hover:bg-muted"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-cool text-cool-foreground">
                            <HugeiconsIcon icon={card.icon} strokeWidth={2} className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-foreground">
                              {card.title}
                            </span>
                            <span className="mt-0.5 block text-sm leading-snug text-cool">
                              {card.description}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      {children}
    </>
  );
}
