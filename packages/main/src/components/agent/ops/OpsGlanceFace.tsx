import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { cn } from "@monrep/utils";
import type { ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import type { BadgeProps } from "@monrep/ui/base";

export type OpsGlanceFaceProps = {
  label: string;
  detail: string;
  icon: IconSvgElement;
  watch: string | number;
  badgeVariant: NonNullable<BadgeProps["variant"]>;
  badgeLabel: string;
  /** Trailing affordance — chevron for links, none for popovers. */
  trailing?: ReactNode;
  className?: string;
};

const TILE_CLASS =
  "group flex min-w-0 w-full items-center gap-3 rounded-lg border border-border/60 bg-card/40 p-3 text-start transition-[background-color,border-color,box-shadow] outline-none hover:border-border hover:bg-card/60 focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function OpsGlanceFace({
  label,
  detail,
  icon,
  watch,
  badgeVariant,
  badgeLabel,
  trailing,
  className,
}: OpsGlanceFaceProps) {
  return (
    <span className={cn(TILE_CLASS, className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground transition-colors group-hover:text-foreground">
        <HugeiconsIcon icon={icon} className="size-4" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold">{label}</span>
          <ImpactFlash
            watch={watch}
            className="shrink-0"
            render={(p) => (
              <Badge {...p} variant={badgeVariant}>
                {badgeLabel}
              </Badge>
            )}
          />
        </span>
        <span className="truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      {trailing}
    </span>
  );
}

export function OpsGlanceChevron() {
  return (
    <HugeiconsIcon
      icon={ArrowRight01Icon}
      className="size-4 shrink-0 text-muted-foreground/60 transition-[color,translate] group-hover:translate-x-0.5 group-hover:text-foreground motion-reduce:transition-none"
      aria-hidden
    />
  );
}
