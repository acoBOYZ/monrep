import { useState } from "react";
import { ChevronDown } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@monrep/utils";
import { Button } from "../base/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../base/dropdown-menu";
import type { ReactNode } from "react";
import type { ButtonProps } from "../base/button";

type MenuAction = {
  id: string;
  label: string;
  onSelect?: () => Promise<void> | void;
  icon?: ReactNode;
  disabled?: boolean;
  /**
   * Optional right-aligned shortcut hint (e.g., "⌘K", "Ctrl+P")
   */
  shortcutHint?: string;
};

export type SplitActionButtonProps = {
  /**
   * Primary button label (left side)
   */
  label: ReactNode;
  /**
   * Primary click handler
   */
  onPrimaryClick?: () => void;
  /**
   * Optional icon shown at the left of the label
   */
  leadingIcon?: ReactNode;
  /**
   * Dropdown actions (right-side arrow)
   */
  actions: Array<MenuAction>;
  /**
   * shadcn size / variant passthroughs
   */
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  /**
   * Disable both buttons
   */
  disabled?: boolean;
  /**
   * Dropdown placement controls
   */
  menuAlign?: "start" | "center" | "end";
  menuSide?: "top" | "right" | "bottom" | "left";
  /**
   * Optional heading for the dropdown
   */
  menuLabel?: string;
  /**
   * Extra class names for the wrapper
   */
  className?: string;
  buttonClassName?: string;
};

/**
 * A split/group button built with shadcn/ui:
 * - Left: primary action
 * - Right: dropdown trigger (large arrow icon by default)
 */
export function SplitActionButton({
  label,
  onPrimaryClick,
  leadingIcon,
  actions,
  size = "default",
  variant = "default",
  disabled = false,
  menuAlign = "start",
  menuSide = "bottom",
  menuLabel,
  className,
  buttonClassName,
}: SplitActionButtonProps) {
  const [open, setOpen] = useState(false);
  const hasMenu = actions.length > 0;

  return (
    <div
      className={cn("inline-flex items-stretch rounded-md shadow-sm", className)}
      aria-label="Split action button"
    >
      <Button
        type="button"
        size={size}
        variant={variant}
        disabled={disabled}
        onClick={onPrimaryClick}
        className={cn(hasMenu && "rounded-r-none", buttonClassName)}
      >
        {leadingIcon}
        <span>{label}</span>
      </Button>

      {hasMenu && (
        <DropdownMenu open={open && !disabled} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size={size}
              variant={variant}
              disabled={disabled || !hasMenu}
              aria-haspopup="menu"
              aria-label={menuLabel}
              className={cn(
                "flex items-center justify-center",
                "rounded-l-none border-l border-l-cool",
              )}
            >
              <HugeiconsIcon
                icon={ChevronDown}
                className={size === "sm" ? "size-4" : size === "lg" ? "size-5" : "size-4"}
              />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align={menuAlign} side={menuSide} className="w-fit">
            {menuLabel ? (
              <>
                <DropdownMenuLabel className="font-semibold text-cool">
                  {menuLabel}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            ) : null}

            {actions.map((act) => (
              <DropdownMenuItem
                key={act.id}
                onSelect={(ev) => {
                  ev.preventDefault();
                  setOpen(false);
                  if (!act.disabled) {
                    void act.onSelect?.();
                  }
                }}
                disabled={act.disabled}
                className="flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  {act.icon}
                  <span>{act.label}</span>
                </span>
                {act.shortcutHint ? (
                  <span className="text-xs text-muted-foreground">{act.shortcutHint}</span>
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
