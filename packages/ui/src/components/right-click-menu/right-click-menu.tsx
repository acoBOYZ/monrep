import { useCallback, useEffect, useRef, useState } from "react";
import "./style.css";
import { cn } from "@monrep/utils";
import { useSmartPopover } from "../../base/smart-popover/popover.store";
import { createRightClickMenuContentRenderer } from "./right-click-menu-content-renderer";
import type { CSSProperties, PropsWithChildren, MouseEvent as ReactMouseEvent } from "react";
import type { RightClickMenuItem } from "./right-click-menu-item";

export type { RightClickMenuItem };

export interface RightClickMenuProps extends PropsWithChildren {
  menuItems: Array<RightClickMenuItem> | (() => Array<RightClickMenuItem>);
  className?: string;
  outline?: boolean;
  /** Border radius for the open-state outline ring. Number values use px. Default: 7. */
  outlineRadius?: number | string;
  disabled?: boolean;
  /** Fires when the popover opens/closes (list-level hosts use this to clear external outline state). */
  onOpenStateChange?: (open: boolean) => void;
}

const formatOutlineRadius = (radius: number | string) =>
  typeof radius === "number" ? `${radius}px` : radius;

export const RightClickMenu = ({
  menuItems,
  className,
  children,
  outline = false,
  outlineRadius = 7,
  disabled,
  onOpenStateChange,
}: RightClickMenuProps) => {
  const { show, hide } = useSmartPopover();
  const anchorRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  const resolveMenuItems = useCallback(() => {
    return typeof menuItems === "function" ? menuItems() : menuItems;
  }, [menuItems]);

  const cleanupAnchor = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    anchor.remove();
    anchorRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanupAnchor();
    };
  }, [cleanupAnchor]);

  const openContextMenuAtPointer = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (disabled) return;

      e.preventDefault();
      e.stopPropagation();

      const nextMenuItems = resolveMenuItems();
      if (!nextMenuItems.length || typeof document === "undefined") return;

      cleanupAnchor();

      const anchor = document.createElement("span");
      anchor.dataset.contextMenuAnchor = "true";
      Object.assign(anchor.style, {
        position: "fixed",
        left: `${e.clientX}px`,
        top: `${e.clientY}px`,
        width: "1px",
        height: "1px",
        opacity: "0",
        pointerEvents: "none",
      });
      document.body.appendChild(anchor);
      anchorRef.current = anchor;
      setVisible(true);
      onOpenStateChange?.(true);

      show({
        anchor,
        side: "right-start",
        offset: 0,
        arrow: false,
        anchorCorner: true,
        className: "min-w-40 space-y-px p-1",
        content: createRightClickMenuContentRenderer(nextMenuItems, disabled),
        onOpenStateChange: (open) => {
          setVisible(open);
          onOpenStateChange?.(open);
          if (!open) cleanupAnchor();
        },
      });
    },
    [cleanupAnchor, disabled, onOpenStateChange, resolveMenuItems, show],
  );

  useEffect(() => {
    if (!disabled) return;
    if (!anchorRef.current) return;
    hide(anchorRef.current);
  }, [disabled, hide]);

  return (
    <div onContextMenu={openContextMenuAtPointer} className={cn("relative size-full", className)}>
      {outline ? (
        <div
          className={cn("relative z-1", visible && "right-click-outline")}
          style={
            { "--right-click-outline-radius": formatOutlineRadius(outlineRadius) } as CSSProperties
          }
        >
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};
