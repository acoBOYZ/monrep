import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FloatingArrow,
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { useAnchorInDocument } from "@monrep/hooks";
import { cn } from "@monrep/utils";
import { useHotkey } from "@tanstack/react-hotkeys";
import type { ReactNode } from "react";
import type { TooltipState } from "./tooltip.store";

const ARROW_HEIGHT = 7;
const ARROW_GAP = 1;
const ARROW_PAD = 12;
const ARROW_STROKE = 1;

type Props = {
  state: TooltipState;
  onClose: () => void;
  className?: string;
};

type ShellProps = {
  state: TooltipState;
  onClose: () => void;
  className?: string;
  children: ReactNode;
};

type ContentHostProps = {
  children: ReactNode;
};

const TooltipContentHost = ({ children }: ContentHostProps) => children;

const TooltipFloatingShell = ({ state, onClose, className, children }: ShellProps) => {
  const [arrowEl, setArrowEl] = useState<SVGSVGElement | null>(null);
  const visible = state.open;

  const middleware = useMemo(
    () => [
      offset(ARROW_HEIGHT + ARROW_GAP),
      flip(),
      shift({ padding: ARROW_PAD }),
      arrow({ element: arrowEl, padding: ARROW_PAD }),
    ],
    [arrowEl],
  );

  const { refs, floatingStyles, placement, context } = useFloating({
    elements: {
      reference: state.anchor,
    },
    placement: state.side,
    middleware,
    whileElementsMounted: autoUpdate,
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
    });

    return () => observer.disconnect();
  }, [visible, state.anchor, onClose]);

  const setFloating = useCallback(
    (node: HTMLDivElement | null) => {
      refs.setFloating(node);
    },
    [refs],
  );

  const side = placement.split("-")[0];
  const animationState = state.open ? "open" : "closed";

  return (
    <div ref={setFloating} style={floatingStyles} className="pointer-events-none z-100">
      <div
        data-state={animationState}
        data-side={side}
        className={cn(
          "hidden sm:block",
          "pointer-events-auto relative text-xs",
          "rounded-lg border border-muted shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]",
          "bg-popover text-popover-foreground",
          "w-fit max-w-56 text-center",
          "data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2",
          "data-[side=top]:slide-in-from-bottom-2",
          "p-2",
          className,
        )}
      >
        {children}
        <FloatingArrow
          ref={setArrowEl}
          context={context}
          width={14}
          height={ARROW_HEIGHT}
          tipRadius={1}
          fill="var(--popover)"
          stroke="var(--muted)"
          strokeWidth={ARROW_STROKE}
        />
      </div>
    </div>
  );
};

export function TooltipOverlayInternal({ state, onClose, className }: Props) {
  const mounted = useAnchorInDocument(state.anchor);

  const resolvedContent = useMemo(() => {
    if (!mounted || state.content == null) return null;
    return <TooltipContentHost>{state.content}</TooltipContentHost>;
  }, [mounted, state.content]);

  if (resolvedContent == null) return null;

  return (
    <TooltipFloatingShell
      key={state.positionKey}
      state={state}
      onClose={onClose}
      className={className}
    >
      {resolvedContent}
    </TooltipFloatingShell>
  );
}
