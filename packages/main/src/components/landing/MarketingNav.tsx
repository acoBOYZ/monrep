import { Button } from "@monrep/ui/base";
import { Link } from "@tanstack/react-router";
import { ContentFrame } from "./ContentFrame";
import { LogoLink } from "@/components/LogoLink";
import { ThemeToggle } from "@/components/ThemeToggle";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <ContentFrame>
        <div className="flex h-14 items-center justify-between gap-3">
          <LogoLink titleAs="span" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button size="sm" render={<Link to="/admin" />} nativeButton={false}>
              Open console
            </Button>
          </div>
        </div>
      </ContentFrame>
    </header>
  );
}
