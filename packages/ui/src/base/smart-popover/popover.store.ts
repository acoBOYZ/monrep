import { createStore } from "@tanstack/react-store";
import type { CSSProperties, ReactNode } from "react";
import type { OffsetOptions, Placement } from "@floating-ui/react";

export type SmartPopoverArrow = boolean | { className?: string };

export type SmartPopoverSide = Placement;

type SmartPopoverContentProps = {
  close: () => void;
};

export type SmartPopoverContentRenderer = (props: SmartPopoverContentProps) => ReactNode;

export type SmartPopoverContent = ReactNode | SmartPopoverContentRenderer;

export type SmartPopoverControllerProps = {
  content: SmartPopoverContent;
  anchor: HTMLElement | null;
  side?: SmartPopoverSide;
  className?: string;
  offset?: OffsetOptions;
  arrow?: SmartPopoverArrow;
  style?: CSSProperties;
  onOpenStateChange?: (open: boolean) => void;
  /** Sharpens the corner touching the anchor after Floating UI resolves placement (context menus). */
  anchorCorner?: boolean;
};

export type SmartPopoverState = Omit<SmartPopoverControllerProps, "content"> & {
  open: boolean;
  positionKey: number;
  content: SmartPopoverContent | null;
};

export const initialSmartPopoverState: SmartPopoverState = {
  open: false,
  anchor: null,
  side: "top",
  className: undefined,
  arrow: undefined,
  style: undefined,
  onOpenStateChange: undefined,
  positionKey: 0,
  content: null,
};

export const smartPopoverStore = createStore(initialSmartPopoverState);

const EXIT_ANIMATION_MS = 140;
let closeTimer: ReturnType<typeof setTimeout> | null = null;
let positionKey = 0;

const isSameShell = (a: SmartPopoverState, b: SmartPopoverState) =>
  a.open === b.open &&
  a.anchor === b.anchor &&
  a.side === b.side &&
  a.className === b.className &&
  a.offset === b.offset &&
  a.arrow === b.arrow &&
  a.style === b.style &&
  a.onOpenStateChange === b.onOpenStateChange &&
  a.anchorCorner === b.anchorCorner &&
  a.positionKey === b.positionKey;

const clearCloseTimer = () => {
  if (!closeTimer) return;
  clearTimeout(closeTimer);
  closeTimer = null;
};

const commit = (next: SmartPopoverState) => {
  const current = smartPopoverStore.state;
  if (isSameShell(current, next) && current.content === next.content) return;
  smartPopoverStore.setState(() => next);
};

export const hideSmartPopover = (anchor?: HTMLElement | null) => {
  const current = smartPopoverStore.state;
  if (!current.anchor || !current.open) return;
  if (anchor && current.anchor !== anchor) return;

  current.onOpenStateChange?.(false);

  if (!document.body.contains(current.anchor)) {
    clearCloseTimer();
    commit(initialSmartPopoverState);
    return;
  }

  clearCloseTimer();
  commit({ ...current, open: false });
  closeTimer = setTimeout(() => {
    if (smartPopoverStore.state.open) {
      closeTimer = null;
      return;
    }
    commit(initialSmartPopoverState);
    closeTimer = null;
  }, EXIT_ANIMATION_MS);
};

export const showSmartPopover = ({
  anchor,
  content,
  side = "top",
  className,
  offset,
  arrow,
  style,
  onOpenStateChange,
  anchorCorner,
}: SmartPopoverControllerProps) => {
  const current = smartPopoverStore.state;
  if (current.open && current.anchor && current.anchor !== anchor) {
    current.onOpenStateChange?.(false);
  }

  clearCloseTimer();
  commit({
    open: true,
    anchor,
    side,
    className,
    offset,
    arrow,
    style,
    onOpenStateChange,
    anchorCorner,
    positionKey: ++positionKey,
    content,
  });
};

export const toggleSmartPopover = (props: SmartPopoverControllerProps) => {
  const current = smartPopoverStore.state;
  if (current.open && current.anchor === props.anchor) {
    hideSmartPopover(props.anchor);
    return;
  }
  showSmartPopover(props);
};

export const updateSmartPopover = ({
  anchor,
  content,
  side = "top",
  className,
  offset,
  arrow,
  style,
  onOpenStateChange,
  anchorCorner,
}: SmartPopoverControllerProps) => {
  const current = smartPopoverStore.state;
  if (!current.open || current.anchor !== anchor) return;

  commit({
    ...current,
    side,
    className,
    offset,
    arrow,
    style,
    onOpenStateChange,
    anchorCorner,
    content,
  });
};

export const useSmartPopover = () => ({
  show: showSmartPopover,
  toggle: toggleSmartPopover,
  update: updateSmartPopover,
  hide: hideSmartPopover,
});
