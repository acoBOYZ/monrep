import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, Separator } from "@monrep/ui/base";
import { cn } from "@monrep/utils";
import { Link } from "@tanstack/react-router";
import { ContentFrame } from "./ContentFrame";
import { LogoLink } from "@/components/LogoLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useScrolled } from "@/components/layouts/useScrolled";

export function MarketingNav() {
  const isScrolled = useScrolled();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/60 transition-[background-color,border-color,backdrop-filter]",
        isScrolled ? "border-transparent bg-background/80 backdrop-blur-md" : "bg-transparent",
      )}
    >
      <ContentFrame>
        <div className="flex h-14 items-center justify-between gap-3">
          <LogoLink titleAs="span" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Separator
              orientation="vertical"
              className="mx-1 my-0 data-[orientation=vertical]:h-5"
            />
            <Button
              size="sm"
              className="gap-1.5"
              render={<Link to="/admin" />}
              nativeButton={false}
            >
              Open console
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" aria-hidden />
            </Button>
          </div>
        </div>
      </ContentFrame>
    </header>
  );
}
