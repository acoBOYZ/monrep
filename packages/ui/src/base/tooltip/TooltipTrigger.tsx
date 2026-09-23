import { useCallback, useRef } from "react";
import { cn } from "@monrep/utils";
import { hideTooltip, showTooltip } from "./tooltip.store";
import type { ReactNode } from "react";
import type { TooltipSide } from "./tooltip.store";

type Props = {
  content: ReactNode;
  side?: TooltipSide;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

export function TooltipTrigger({ children, content, side, className, disabled = false }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const handleShowTooltip = useCallback(() => {
    if (disabled) return;
    if (ref.current) showTooltip(ref.current, content, side);
  }, [disabled, content, side]);

  return (
    <span
      className={cn("inline-flex", className)}
      ref={ref}
      onMouseEnter={handleShowTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
    </span>
  );
}
