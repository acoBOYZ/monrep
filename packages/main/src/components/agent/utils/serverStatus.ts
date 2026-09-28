import type { BadgeProps } from "@monrep/ui/base";
import type { TServerDo } from "@/db/types";

export function serverStatusVariant(
  status: TServerDo["status"],
): NonNullable<BadgeProps["variant"]> {
  switch (status) {
    case "online":
      return "success";
    case "pending":
      return "warning";
    case "offline":
      return "destructive";
    case "revoked":
      return "muted";
    default:
      return "muted";
  }
}
