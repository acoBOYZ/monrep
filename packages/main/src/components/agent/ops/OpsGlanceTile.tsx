import { Link } from "@tanstack/react-router";
import { OpsGlanceChevron, OpsGlanceFace } from "./OpsGlanceFace";
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
      className="min-w-0"
    >
      <OpsGlanceFace
        label={label}
        detail={detail}
        icon={icon}
        watch={watch}
        badgeVariant={badgeVariant}
        badgeLabel={badgeLabel}
        trailing={<OpsGlanceChevron />}
      />
    </Link>
  );
}
