import { ChevronRightIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../base/dropdown-menu";
import { DebouncedMenuItem } from "./debounced-menu-item";
import {
  getMenuEntryKey,
  getMenuItemRowClassName,
  resolveItemSuffix,
  stopMenuRowMouseDown,
} from "./right-click-menu-item";
import { RightClickMenuDivider, RightClickMenuItemInner } from "./right-click-menu-row";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import type { RightClickMenuItem } from "./right-click-menu-item";

const preventSubmenuCloseAutoFocus = (event: Event) => {
  event.preventDefault();
};

const RightClickSubmenuChild = ({
  item,
  menuDisabled,
  onClose,
}: {
  item: Omit<RightClickMenuItem, "childs">;
  menuDisabled?: boolean;
  onClose: () => void;
}) => {
  const isDisabled = Boolean(menuDisabled || item.disabled);
  const suffix = resolveItemSuffix(item);

  const activateChildAndCloseMenu = (event: ReactMouseEvent) => {
    if (item.disabled || item.hidden) return;
    item.onClick?.(event);
    onClose();
  };

  const forwardChildPointerEnter = () => {
    item.onPointerEnter?.();
  };

  if (item.divider && !item.hidden) {
    return <RightClickMenuDivider />;
  }

  if (item.debounceId) {
    return (
      <DebouncedMenuItem
        label={item.label}
        icon={item.icon}
        suffix={suffix}
        onClick={item.onClick}
        onPointerEnter={item.onPointerEnter}
        onFocus={item.onFocus}
        debounceId={item.debounceId}
        debounceMs={item.debounceMs}
        variant={item.variant}
        disabled={isDisabled}
        hidden={item.hidden}
        onCloseMenu={onClose}
      />
    );
  }

  return (
    <DropdownMenuItem
      className={getMenuItemRowClassName({
        disabled: isDisabled,
        hidden: item.hidden,
        variant: item.variant,
      })}
      disabled={isDisabled}
      onMouseDown={stopMenuRowMouseDown}
      onClick={activateChildAndCloseMenu}
      onPointerEnter={forwardChildPointerEnter}
      onFocus={item.onFocus}
    >
      <RightClickMenuItemInner icon={item.icon} label={item.label} suffix={suffix} />
    </DropdownMenuItem>
  );
};

export const RightClickSubmenuRow = ({
  item,
  itemKey,
  suffix,
  menuDisabled,
  onClose,
}: {
  item: RightClickMenuItem;
  itemKey: string;
  suffix?: ReactNode;
  menuDisabled?: boolean;
  onClose: () => void;
}) => {
  const isDisabled = Boolean(menuDisabled || item.disabled);
  const childs = item.childs ?? [];
  const childEntries = childs.map((child, index) => ({
    child,
    key: `${itemKey}-${getMenuEntryKey(child, index)}`,
  }));

  const forwardParentPointerEnter = () => {
    item.onPointerEnter?.();
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        asChild
        nativeButton={false}
        openOnHover
        delay={50}
        closeDelay={150}
        disabled={isDisabled}
      >
        <div
          role="menuitem"
          tabIndex={isDisabled ? -1 : 0}
          data-context-menu="true"
          aria-haspopup="menu"
          aria-disabled={item.disabled}
          className={getMenuItemRowClassName({
            disabled: isDisabled,
            hidden: item.hidden,
            variant: item.variant,
          })}
          onMouseDown={stopMenuRowMouseDown}
          onPointerEnter={forwardParentPointerEnter}
          onFocus={item.onFocus}
        >
          <RightClickMenuItemInner
            icon={item.icon}
            label={item.label}
            suffix={suffix}
            end={
              <HugeiconsIcon
                icon={ChevronRightIcon}
                className="size-4 shrink-0 text-muted-foreground"
              />
            }
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="start"
        sideOffset={6}
        className="min-w-40 space-y-px p-1"
        positionerClassName="isolate z-[110] outline-none"
        onMouseDown={stopMenuRowMouseDown}
        onCloseAutoFocus={preventSubmenuCloseAutoFocus}
      >
        {childEntries.map(({ child, key }) => (
          <RightClickSubmenuChild
            key={key}
            item={child}
            menuDisabled={menuDisabled}
            onClose={onClose}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
