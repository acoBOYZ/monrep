import { useMemo } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import type { UseHotkeyOptions } from "@tanstack/react-hotkeys";
import type { RightClickMenuHotkeyBinding, RightClickMenuItem } from "./right-click-menu-item";

export const RightClickMenuHotkeyRegistration = ({
  item,
  binding,
  onActivate,
  enabled,
}: {
  item: RightClickMenuItem;
  binding: RightClickMenuHotkeyBinding;
  onActivate: (item: RightClickMenuItem) => void;
  enabled: boolean;
}) => {
  const options = useMemo<UseHotkeyOptions>(
    () => ({
      ignoreInputs: true,
      preventDefault: true,
      ...binding.options,
      enabled,
    }),
    [binding.options, enabled],
  );

  useHotkey(
    binding.hotkey,
    () => {
      onActivate(item);
    },
    options,
  );

  return null;
};
