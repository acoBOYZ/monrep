import { cn } from "@monrep/utils";
import { formatForDisplay } from "@tanstack/react-hotkeys";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import type { Hotkey, UseHotkeyOptions } from "@tanstack/react-hotkeys";

export type RightClickMenuHotkeyBinding = {
  hotkey: Hotkey;
  options?: UseHotkeyOptions;
};

export type RightClickMenuHotkeyInput = Hotkey | RightClickMenuHotkeyBinding;

export const isHotkeyBinding = (
  input: RightClickMenuHotkeyInput,
): input is RightClickMenuHotkeyBinding => typeof input === "object" && "hotkey" in input;

export type RightClickMenuItem = {
  label?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
  onClick?: (e?: ReactMouseEvent) => void;
  onPointerEnter?: (e?: ReactMouseEvent) => void;
  onFocus?: () => void;
  disabled?: boolean;
  hidden?: boolean;
  divider?: boolean;
  variant?: "default" | "success" | "destructive" | "warning" | "info";
  debounceId?: string;
  debounceMs?: number;
  hotkey?: RightClickMenuHotkeyInput;
  hotkeys?: RightClickMenuHotkeyInput | Array<RightClickMenuHotkeyInput>;
  childs?: Array<Omit<RightClickMenuItem, "childs">>;
};

export const getVariantClass = (variant: RightClickMenuItem["variant"]) =>
  ({
    default: "hover:bg-muted/90 hover:text-foreground focus-visible:ring-muted/30",
    success: "text-success hover:bg-primary/10 focus-visible:ring-primary/30",
    destructive: "text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/30",
    warning: "text-warning hover:bg-warning/10 focus-visible:ring-warning/30",
    info: "text-primary hover:bg-primary/10 focus-visible:ring-primary/30",
  })[variant ?? "default"];

export const getMenuItemRowClassName = ({
  disabled,
  hidden,
  variant,
}: {
  disabled?: boolean;
  hidden?: boolean;
  variant?: RightClickMenuItem["variant"];
}) =>
  cn(
    "flex w-full items-center justify-between gap-2 rounded-md py-1 pr-1 pl-3 text-left text-sm transition-colors",
    "focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:outline-none",
    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
    hidden && "hidden",
    getVariantClass(variant),
  );

export const stopMenuRowMouseDown = (event: { stopPropagation: () => void }) => {
  event.stopPropagation();
};

export const hasVisibleChilds = (item: RightClickMenuItem) =>
  Boolean(item.childs?.some((child) => !child.hidden));

export const normalizeHotkeyBinding = (
  input: RightClickMenuHotkeyInput,
): RightClickMenuHotkeyBinding => {
  if (isHotkeyBinding(input)) {
    return input;
  }

  return { hotkey: input };
};

export const resolveHotkeyInputs = (item: RightClickMenuItem) => {
  const inputs: Array<RightClickMenuHotkeyInput> = [];
  if (item.hotkey) inputs.push(item.hotkey);
  if (item.hotkeys) {
    inputs.push(...(Array.isArray(item.hotkeys) ? item.hotkeys : [item.hotkeys]));
  }
  return inputs;
};

export const resolveItemSuffix = (item: RightClickMenuItem): ReactNode => {
  if (item.suffix !== undefined && item.suffix !== null) {
    return item.suffix;
  }

  const shortcut = resolveHotkeyInputs(item)
    .flatMap((input) => {
      const formattedHotkey = formatForDisplay(normalizeHotkeyBinding(input).hotkey);
      return formattedHotkey ? [formattedHotkey] : [];
    })
    .join(" / ");

  if (!shortcut) return undefined;
  return shortcut;
};

export const getMenuEntryKey = (item: RightClickMenuItem, index: number) => {
  const hotkeyValue = resolveHotkeyInputs(item)
    .map((input) => normalizeHotkeyBinding(input).hotkey)
    .join("-");
  const baseKey =
    item.debounceId ||
    item.label ||
    hotkeyValue ||
    `${item.variant ?? "default"}-${item.divider ? "divider" : "item"}`;

  return `${baseKey}-${index + 1}`;
};

export const flattenHotkeyItems = (item: RightClickMenuItem, key: string) => {
  const hotkeyItems = item.childs?.length ? item.childs : [item];
  return hotkeyItems.flatMap((hotkeyItem, childIndex) =>
    resolveHotkeyInputs(hotkeyItem).map((input, index) => ({
      key: `${key}-hotkey-${childIndex}-${index}`,
      item: hotkeyItem,
      binding: normalizeHotkeyBinding(input),
    })),
  );
};
