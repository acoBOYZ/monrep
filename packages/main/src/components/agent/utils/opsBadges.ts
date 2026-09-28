import type { BadgeProps } from "@monrep/ui/base";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

export function dockerStateVariant(state: string): BadgeVariant {
  switch (state) {
    case "running":
      return "success";
    case "restarting":
    case "paused":
    case "created":
      return "warning";
    case "exited":
    case "dead":
      return "destructive";
    default:
      return "muted";
  }
}

export function unitStateVariant(active: string, sub: string): BadgeVariant {
  if (active === "failed" || sub === "failed") return "destructive";
  return unitActiveVariant(active);
}

function unitActiveVariant(active: string): BadgeVariant {
  switch (active) {
    case "active":
      return "success";
    case "activating":
    case "reloading":
      return "warning";
    case "failed":
      return "destructive";
    default:
      return "muted";
  }
}
