import { Activity, Add01Icon, FlowIcon, Server } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { LinkProps } from "@tanstack/react-router";

export type NavCard = {
  to: LinkProps["to"];
  title: string;
  description: string;
  icon: IconSvgElement;
};

export type NavGroup = {
  id: "fleet" | "playground";
  label: string;
  cards: Array<NavCard>;
};

const FLEET_CARDS: Array<NavCard> = [
  {
    to: "/servers",
    title: "Servers",
    description: "Fleet list",
    icon: Server,
  },
  {
    to: "/servers/new",
    title: "Add server",
    description: "Connect agent",
    icon: Add01Icon,
  },
];

const PLAYGROUND_CARDS: Array<NavCard> = [
  {
    to: "/playground/presence",
    title: "Presence",
    description: "Live collection sandbox",
    icon: Activity,
  },
  {
    to: "/playground/streams",
    title: "Streams",
    description: "DO / stream experiments",
    icon: FlowIcon,
  },
];

/** Desktop + mobile nav groups. Playground is DEV-only (omitted from prod builds). */
export function getNavGroups(): Array<NavGroup> {
  const groups: Array<NavGroup> = [{ id: "fleet", label: "Fleet", cards: FLEET_CARDS }];
  if (import.meta.env.DEV) {
    groups.push({ id: "playground", label: "Playground", cards: PLAYGROUND_CARDS });
  }
  return groups;
}
