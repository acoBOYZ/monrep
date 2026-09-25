import { Button } from "@monrep/ui/base";
import { Link } from "@tanstack/react-router";
import { ContentFrame } from "./frame";
import { LogoLink } from "@/components/LogoLink";

const NAV_ANCHORS = [
  { href: "#capabilities", label: "Capabilities" },
  { href: "#get-started", label: "Get started" },
] as const;

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <ContentFrame className="relative">
        <div className="flex h-14 items-center justify-between gap-3">
          <LogoLink titleAs="span" />
          <nav
            aria-label="Page"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex"
          >
            {NAV_ANCHORS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full px-4"
              render={<Link to="/admin" />}
            >
              Log in
            </Button>
            <Button size="sm" className="rounded-full px-4" render={<Link to="/admin" />}>
              Open console
            </Button>
          </div>
        </div>
      </ContentFrame>
    </header>
  );
}
