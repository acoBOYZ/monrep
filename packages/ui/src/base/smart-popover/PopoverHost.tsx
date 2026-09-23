import { Activity } from "react";
import { useSelector } from "@tanstack/react-store";
import { SmartPopoverOverlayInternal } from "./PopoverOverlay";
import { hideSmartPopover, smartPopoverStore } from "./popover.store";

export function SmartPopoverHost() {
  const state = useSelector(smartPopoverStore, (s) => s);
  return (
    <Activity name="smart-popover" mode={state.anchor ? "visible" : "hidden"}>
      <SmartPopoverOverlayInternal state={state} onClose={hideSmartPopover} />
    </Activity>
  );
}
