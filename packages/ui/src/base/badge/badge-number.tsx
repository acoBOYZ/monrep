import { cn } from "@monrep/utils";
import type { AnimationEventHandler, Ref } from "react";

type BadgeNumberProps = {
  value: number | null;
  className?: string;
  size?: "default" | "sm" | "lg";
  ref?: Ref<HTMLSpanElement>;
  onAnimationEnd?: AnimationEventHandler<HTMLSpanElement>;
};

export const BadgeNumber = ({
  value,
  className,
  size = "default",
  ref,
  onAnimationEnd,
}: BadgeNumberProps) => {
  if (!value) return null;
  const minValue = Math.min(value, 99);
  const isGreaterThan99 = value > 99;

  return (
    <span
      ref={ref}
      onAnimationEnd={onAnimationEnd}
      className={cn(
        "absolute top-px left-px flex h-3 min-w-3 items-center justify-center shadow",
        "rounded rounded-tl-none bg-avatar px-0.5 text-[9px] font-bold text-primary-foreground",
        "ring-2 ring-background",
        size === "sm" && "h-3 min-w-3 px-0.5 text-[9px] font-bold",
        size === "lg" && "h-3.5 min-w-3.5 px-0.75 text-[11px] font-bold",
        className,
      )}
    >
      {isGreaterThan99 ? "99+" : minValue}
    </span>
  );
};
