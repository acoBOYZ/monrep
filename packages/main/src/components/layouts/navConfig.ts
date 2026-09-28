import { Add01Icon, DashboardSquare01Icon, Server } from "@hugeicons/core-free-icons";
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
    icon: DashboardSquare01Icon,
  },
  {
    to: "/servers",
    title: "Servers",
    icon: Server,
  },
  {
    to: "/servers/new",
    title: "Add server",
    icon: Add01Icon,
  },
];

/** Desktop + mobile nav groups. */
export function getNavGroups(): Array<NavGroup> {
  return [{ id: "fleet", label: "Fleet", cards: FLEET_CARDS }];
}
