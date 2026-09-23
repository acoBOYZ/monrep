import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  FloatingArrow,
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { useAnchorInDocument, useClickOutside } from "@monrep/hooks";
import { cn } from "@monrep/utils";
import { useHotkey } from "@tanstack/react-hotkeys";
import { getAnchorCornerClass } from "./anchor-corner";
import type { ReactNode } from "react";
import type { SmartPopoverState } from "./popover.store";

const ARROW_HEIGHT = 8;
const ARROW_GAP = 4;
const ARROW_PAD = 12;
const ARROW_STROKE = 1;
const ARROW_DEFAULT_OFFSET = ARROW_HEIGHT + ARROW_GAP;

type Props = {
  state: SmartPopoverState;
  onClose: () => void;
  className?: string;
};

type ShellProps = {
  state: SmartPopoverState;
  onClose: () => void;
  className?: string;
  children: ReactNode;
};

type ContentHostProps = {
  children: ReactNode;
};

const SmartPopoverContentHost = ({ children }: ContentHostProps) => children;

const SmartPopoverFloatingShell = ({ state, onClose, className, children }: ShellProps) => {
  const [arrowEl, setArrowEl] = useState<SVGSVGElement | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const visible = state.open;
  const arrowEnabled = state.arrow !== false;
  const arrowClassName = typeof state.arrow === "object" ? state.arrow.className : undefined;

  useLayoutEffect(() => {
    anchorRef.current = state.anchor;
  }, [state.anchor]);

  const middleware = useMemo(() => {
    const chain = [
      offset(state.offset ?? ARROW_DEFAULT_OFFSET),
      flip(),
      shift({ padding: ARROW_PAD }),
      arrowEnabled ? arrow({ element: arrowEl, padding: ARROW_PAD }) : null,
    ];

    return chain;
  }, [arrowEnabled, state.offset, arrowEl]);

  const { refs, floatingStyles, placement, context } = useFloating({
    elements: {
      reference: state.anchor,
    },
    placement: state.side,
    middleware,
    whileElementsMounted: autoUpdate,
  });

  const setFloating = useCallback(
    (node: HTMLDivElement | null) => {
      floatingRef.current = node;
      refs.setFloating(node);
    },
    [refs],
  );

  useClickOutside([anchorRef, floatingRef], () => {
    if (visible) onClose();
  });

  useHotkey(
    "Escape",
    () => {
      onClose();
    },
    {
      enabled: visible,
      conflictBehavior: "allow",
    },
  );

  useEffect(() => {
    if (!visible || !state.anchor) return;

    const observer = new MutationObserver(() => {
      if (!document.body.contains(state.anchor)) {
        onClose();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [visible, state.anchor, onClose]);

  const side = placement.split("-")[0];
  const animationState = state.open ? "open" : "closed";

  return (
    <div
      ref={setFloating}
      style={{ ...floatingStyles, ...state.style }}
      data-smart-popover-content=""
      className="pointer-events-none z-100"
    >
      <div
        data-state={animationState}
        data-side={side}
        data-placement={state.anchorCorner ? placement : undefined}
        data-smart-popover-content=""
        className={cn(
          "pointer-events-auto relative text-lg",
          "rounded-lg border border-border shadow-lg",
          "ui-backdrop-blur ui-backdrop-blur-xs bg-popover",
          "data-[state=closed]:animate-out data-[state=open]:animate-in",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2",
          "data-[side=top]:slide-in-from-bottom-2",
          "p-2",
          className,
          state.className,
          state.anchorCorner && getAnchorCornerClass(placement),
        )}
      >
        {children}
        {arrowEnabled ? (
          <FloatingArrow
            ref={setArrowEl}
            context={context}
            width={16}
            height={ARROW_HEIGHT}
            tipRadius={1}
            fill="var(--popover)"
            stroke="var(--border)"
            strokeWidth={ARROW_STROKE}
            className={arrowClassName}
          />
        ) : null}
      </div>
    </div>
  );
};

export function SmartPopoverOverlayInternal({ state, onClose, className }: Props) {
  const mounted = useAnchorInDocument(state.anchor);
  const content = state.content;

  const resolvedContent = useMemo(() => {
    if (!mounted || content == null) return null;
    const node = typeof content === "function" ? content({ close: onClose }) : content;
    return <SmartPopoverContentHost>{node}</SmartPopoverContentHost>;
  }, [content, mounted, onClose]);

  if (!mounted || resolvedContent == null) return null;

  return (
    <SmartPopoverFloatingShell
      key={state.positionKey}
      state={state}
      onClose={onClose}
      className={className}
    >
      {resolvedContent}
    </SmartPopoverFloatingShell>
  );
}
