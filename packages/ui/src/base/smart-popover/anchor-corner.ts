import type { Placement } from "@floating-ui/react";

/** Sharpens the popover corner that touches a point anchor (e.g. context menu cursor). */
export const getAnchorCornerClass = (placement: Placement): string => {
  const [side, align = "center"] = placement.split("-") as [string, string?];

  if (side === "right") {
    return align === "end" ? "rounded-bl-none" : "rounded-tl-none";
  }
  if (side === "left") {
    return align === "end" ? "rounded-br-none" : "rounded-tr-none";
  }
  if (side === "bottom") {
    return align === "end" ? "rounded-tr-none" : "rounded-tl-none";
  }
  if (side === "top") {
    return align === "end" ? "rounded-br-none" : "rounded-bl-none";
  }

  return "";
};
