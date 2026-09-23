import { createStore } from "@tanstack/react-store";
import type { ReactNode } from "react";
import type { Placement } from "@floating-ui/react";

export type TooltipSide = Placement;

export type TooltipState = {
  open: boolean;
  anchor: HTMLElement | null;
  content: ReactNode;
  side: TooltipSide;
  positionKey: number;
};

export const initialTooltipState: TooltipState = {
  open: false,
  anchor: null,
  content: null,
  side: "top",
  positionKey: 0,
};

export const tooltipStore = createStore(initialTooltipState);

const EXIT_ANIMATION_MS = 111;
let closeTimer: ReturnType<typeof setTimeout> | null = null;

const clearCloseTimer = () => {
  if (!closeTimer) return;
  clearTimeout(closeTimer);
  closeTimer = null;
};

const finalizeClose = () => {
  if (tooltipStore.state.open) {
    closeTimer = null;
    return;
  }
  tooltipStore.setState(() => initialTooltipState);
  closeTimer = null;
};

export const showTooltip = (anchor: HTMLElement, content: ReactNode, side: TooltipSide = "top") => {
  clearCloseTimer();
  tooltipStore.setState((current) => ({
    open: true,
    anchor,
    content,
    side,
    positionKey: current.positionKey + 1,
  }));
};

export const hideTooltip = () => {
  const current = tooltipStore.state;
  if (!current.anchor || !current.open) return;

  if (!document.body.contains(current.anchor)) {
    clearCloseTimer();
    tooltipStore.setState(() => initialTooltipState);
    return;
  }

  clearCloseTimer();
  tooltipStore.setState(() => ({ ...current, open: false }));
  closeTimer = setTimeout(finalizeClose, EXIT_ANIMATION_MS);
};
