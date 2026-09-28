import { useCallback, useMemo } from "react";
import { DebouncedMenuItem } from "./debounced-menu-item";
import { RightClickMenuHotkeyRegistration } from "./right-click-menu-hotkey";
import {
  flattenHotkeyItems,
  getMenuEntryKey,
  hasVisibleChilds,
  resolveItemSuffix,
} from "./right-click-menu-item";
import { RightClickMenuDivider, RightClickMenuLeafRow } from "./right-click-menu-row";
import { RightClickSubmenuRow } from "./right-click-submenu-row";
import type { RightClickMenuItem } from "./right-click-menu-item";

export const RightClickMenuContent = ({
  menuItems,
  disabled,
  onClose,
}: {
  menuItems: Array<RightClickMenuItem>;
  disabled?: boolean;
  onClose: () => void;
}) => {
  const menuEntries = useMemo(() => {
    return menuItems.map((item, index) => ({
      item,
      key: getMenuEntryKey(item, index),
      suffix: resolveItemSuffix(item),
    }));
  }, [menuItems]);

  const hotkeyBindings = useMemo(() => {
    return menuEntries.flatMap(({ item, key }) =>
      flattenHotkeyItems(item, key).map((binding) => binding),
    );
  }, [menuEntries]);

  const activateHotkeyAndCloseMenu = useCallback(
    (item: RightClickMenuItem) => {
      if (disabled || item.disabled || item.hidden) return;
      item.onClick?.();
      onClose();
    },
    [disabled, onClose],
  );

  return (
    <div role="menu">
      {menuEntries.map(({ item, key, suffix }) => {
        if (item.divider && !item.hidden) {
          return <RightClickMenuDivider key={key} />;
        }

        const isDisabled = Boolean(item.disabled);

        if (hasVisibleChilds(item)) {
          return (
            <RightClickSubmenuRow
              key={key}
              item={item}
              itemKey={key}
              suffix={suffix}
              menuDisabled={disabled}
              onClose={onClose}
            />
          );
        }

        if (item.debounceId) {
          return (
            <DebouncedMenuItem
              key={key}
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
          <RightClickMenuLeafRow
            key={key}
            item={item}
            suffix={suffix}
            disabled={isDisabled}
            onClose={onClose}
          />
        );
      })}

      {hotkeyBindings.map(({ key, item, binding }) => (
        <RightClickMenuHotkeyRegistration
          key={key}
          item={item}
          binding={binding}
          enabled={true}
          onActivate={activateHotkeyAndCloseMenu}
        />
      ))}
    </div>
  );
};
