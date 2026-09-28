import { getMenuItemRowClassName, stopMenuRowMouseDown } from "./right-click-menu-item";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import type { RightClickMenuItem } from "./right-click-menu-item";

export const RightClickMenuDivider = () => (
  <div
    className="my-px h-px bg-linear-to-b from-transparent via-border to-transparent"
    aria-hidden="true"
  />
);

export const RightClickMenuItemInner = ({
  icon,
  label,
  suffix,
  end,
}: {
  icon?: ReactNode;
  label?: string;
  suffix?: ReactNode;
  end?: ReactNode;
}) => (
  <>
    <div className="flex items-center gap-2 truncate">
      {icon ? <span className="text-base">{icon}</span> : null}
      <span className="truncate text-sm font-medium text-foreground">{label}</span>
    </div>
    {suffix || end ? (
      <span className="flex items-center gap-1">
        {suffix ? <span className="text-[11px] text-muted-foreground">{suffix}</span> : null}
        {end}
      </span>
    ) : null}
  </>
);

export const RightClickMenuLeafRow = ({
  item,
  suffix,
  disabled,
  onClose,
}: {
  item: RightClickMenuItem;
  suffix?: ReactNode;
  disabled?: boolean;
  onClose: () => void;
}) => {
  const activateLeafAndCloseMenu = (event: ReactMouseEvent) => {
    if (item.disabled || item.hidden) return;
    item.onClick?.(event);
    onClose();
  };

  return (
    <button
      type="button"
      className={getMenuItemRowClassName({
        disabled,
        hidden: item.hidden,
        variant: item.variant,
      })}
      data-context-menu="true"
      onMouseDown={stopMenuRowMouseDown}
      onClick={activateLeafAndCloseMenu}
      onPointerEnter={item.onPointerEnter}
      onFocus={item.onFocus}
      disabled={disabled}
      aria-disabled={item.disabled}
      role="menuitem"
    >
      <RightClickMenuItemInner icon={item.icon} label={item.label} suffix={suffix} />
    </button>
  );
};
