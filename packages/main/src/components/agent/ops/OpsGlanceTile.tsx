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
      className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card/40 p-3 transition-colors hover:bg-card/60"
    >
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={icon} className="size-4 text-muted-foreground" aria-hidden />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <ImpactFlash
        watch={watch}
        render={(p) => (
          <Badge {...p} variant={badgeVariant}>
            {badgeLabel}
          </Badge>
        )}
      />
      <span className="text-xs text-muted-foreground">{detail}</span>
    </Link>
  );
}
