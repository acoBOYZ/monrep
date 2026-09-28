import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { Link } from "@tanstack/react-router";
import type { IconSvgElement } from "@hugeicons/react";
import type { BadgeProps } from "@monrep/ui/base";
import type { LinkProps } from "@tanstack/react-router";

type OpsGlanceTileProps = {
  label: string;
  detail: string;
  icon: IconSvgElement;
  to: LinkProps["to"];
  params?: LinkProps["params"];
  watch: string | number;
  badgeVariant: NonNullable<BadgeProps["variant"]>;
  badgeLabel: string;
};

export function OpsGlanceTile({
  label,
  detail,
  icon,
  to,
  params,
  watch,
  badgeVariant,
  badgeLabel,
}: OpsGlanceTileProps) {
  return (
    <Link
      to={to}
      params={params}
      aria-label={`${label}: ${badgeLabel}. ${detail}`}
      className="group flex min-w-0 items-center gap-3 rounded-lg border border-border/60 bg-card/40 p-3 transition-[background-color,border-color,box-shadow] outline-none hover:border-border hover:bg-card/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground transition-colors group-hover:text-foreground">
        <HugeiconsIcon icon={icon} className="size-4" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
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
        </div>
        <span className="truncate text-xs text-muted-foreground">{detail}</span>
      </div>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        className="size-4 shrink-0 text-muted-foreground/60 transition-[color,translate] group-hover:translate-x-0.5 group-hover:text-foreground motion-reduce:transition-none"
        aria-hidden
      />
    </Link>
  );
}
