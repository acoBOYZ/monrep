import { AddCircleHalfDotIcon, DashboardCircleIcon, ServerIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { LinkProps } from "@tanstack/react-router";

type NavCard = {
  to: LinkProps["to"];
  title: string;
  icon: IconSvgElement;
};

export type NavGroup = {
  id: "fleet";
  label: string;
  cards: Array<NavCard>;
};

const FLEET_CARDS: Array<NavCard> = [
  {
    to: "/dashboard",
    title: "Dashboard",
    icon: DashboardCircleIcon,
  },
  {
    to: "/servers",
    title: "Servers",
    icon: ServerIcon,
  },
  {
    to: "/servers/new",
    title: "Add server",
    icon: AddCircleHalfDotIcon,
  },
];

/** Desktop + mobile nav groups. */
export function getNavGroups(): Array<NavGroup> {
  return [{ id: "fleet", label: "Fleet", cards: FLEET_CARDS }];
}
