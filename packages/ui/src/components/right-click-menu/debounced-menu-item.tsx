import { useEffect, useState } from "react";
import { getItemWithExpiry, setItemWithExpiry, useObjectReducer } from "@monrep/hooks";
import { cn } from "@monrep/utils";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import type { RightClickMenuItem } from "./right-click-menu-item";

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const debounceKey = (id: string) => `debounced-btn:${id}`;

function readExpiresAt(debounceId?: string): number | null {
  if (!debounceId) return null;
  const stored = getItemWithExpiry<number>(debounceKey(debounceId));
  return typeof stored === "number" && stored > Date.now() ? stored : null;
}

interface Props {
  label?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
  onClick?: (e?: ReactMouseEvent) => void;
  onPointerEnter?: (e?: ReactMouseEvent) => void;
  onFocus?: () => void;
  debounceId?: string;
  debounceMs?: number;
  variant?: RightClickMenuItem["variant"];
  disabled?: boolean;
  hidden?: boolean;
  onCloseMenu: () => void;
}

export const DebouncedMenuItem = ({
  label,
  icon,
  suffix,
  onClick,
  onPointerEnter,
  onFocus,
  debounceId,
  debounceMs = 10_000,
  variant = "default",
  disabled,
  hidden,
  onCloseMenu,
}: Props) => {
  const [initial] = useState(() => {
    const expiresAt = readExpiresAt(debounceId);
    return {
      expiresAt,
      remaining: expiresAt ? Math.max(0, expiresAt - Date.now()) : 0,
    };
  });
  const {
    state: { expiresAt, remaining },
    set,
  } = useObjectReducer(initial);
  const isWaiting = remaining > 0;

  useEffect(() => {
    if (!isWaiting || expiresAt == null) return;

    const interval = setInterval(() => {
      const timeLeft = Math.max(0, expiresAt - Date.now());
      set("remaining", timeLeft);

      if (timeLeft <= 0) {
        clearInterval(interval);
        set("expiresAt", null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, isWaiting, set]);

  const runDebouncedMenuItemAction = (e?: ReactMouseEvent) => {
    if (disabled || hidden || isWaiting || !debounceId) return;

    const newTTL = Date.now() + debounceMs;
    set("expiresAt", newTTL);
    set("remaining", debounceMs);
    setItemWithExpiry(debounceKey(debounceId), newTTL, debounceMs);

    onClick?.(e);
    onCloseMenu();
  };

  const variantClass = {
    default: "hover:bg-muted/90 hover:text-foreground focus-visible:ring-muted/30",
    success: "text-success hover:bg-success/10 focus-visible:ring-success/30",
    destructive: "text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/30",
    warning: "text-warning hover:bg-warning/10 focus-visible:ring-warning/30",
    info: "text-primary hover:bg-primary/10 focus-visible:ring-primary/30",
  }[variant];

  const handleOnMouseDown = (e: ReactMouseEvent) => {
    e.stopPropagation();
  };

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors duration-75",
        "focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:outline-none",
        disabled || isWaiting ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        hidden && "hidden",
        variantClass,
      )}
      data-context-menu="true"
      onMouseDown={handleOnMouseDown}
      onClick={runDebouncedMenuItemAction}
      onPointerEnter={onPointerEnter}
      onFocus={onFocus}
      disabled={disabled || isWaiting}
      role="menuitem"
    >
      <div className="flex items-center gap-1.5 truncate">
        {icon && <span className="text-base">{icon}</span>}
        <span className="truncate text-sm font-medium text-foreground">{label}</span>
      </div>
      {isWaiting ? (
        <small className="min-w-11 rounded border border-border/80 px-2 py-0.5 text-center text-[11px] text-muted-foreground/90">
          {formatTime(remaining)}
        </small>
      ) : (
        suffix && <span className="text-[11px] text-muted-foreground">{suffix}</span>
      )}
    </button>
  );
};
