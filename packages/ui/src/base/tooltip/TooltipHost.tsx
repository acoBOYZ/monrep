import { Activity } from "react";
import { useSelector } from "@tanstack/react-store";
import { TooltipOverlayInternal } from "./TooltipOverlay";
import { hideTooltip, tooltipStore } from "./tooltip.store";

export function TooltipHost() {
  const state = useSelector(tooltipStore, (s) => s);
  return (
    <Activity name="smart-tooltip" mode={state.anchor ? "visible" : "hidden"}>
      <TooltipOverlayInternal state={state} onClose={hideTooltip} />
    </Activity>
  );
}
