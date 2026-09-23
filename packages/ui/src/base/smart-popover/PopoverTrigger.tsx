import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef } from "react";
import { cn } from "@monrep/utils";
import { useSmartPopover } from "./popover.store";
import type { ReactNode } from "react";
import type { SmartPopoverContentRenderer, SmartPopoverControllerProps } from "./popover.store";

interface Props extends Omit<SmartPopoverControllerProps, "anchor" | "onOpenStateChange"> {
  children: ReactNode;
  anchor?: HTMLElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  triggerClassName?: string;
}

export function SmartPopoverTrigger({
  children,
  anchor,
  content,
  side,
  className,
  offset,
  arrow,
  style,
  open: controlledOpen,
  onOpenChange,
  disabled = false,
  triggerClassName,
}: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const { show, hide, toggle } = useSmartPopover();
  const isControlled = controlledOpen !== undefined;
  const previousControlledOpenRef = useRef(false);

  const resolveAnchorElement = useCallback(() => {
    if (anchor) {
      return anchor;
    }

    const root = ref.current;
    if (!root) return null;

    if (root.childElementCount === 1 && root.firstElementChild instanceof HTMLElement) {
      return root.firstElementChild;
    }

    return root;
  }, [anchor]);

  const config = {
    content,
    side,
    className,
    offset,
    arrow,
    style,
    onOpenStateChange: isControlled ? onOpenChange : undefined,
  };
  const latestConfigRef = useRef(config);
  useLayoutEffect(() => {
    latestConfigRef.current = config;
  });

  const renderLiveContent = useCallback<SmartPopoverContentRenderer>((props) => {
    const current = latestConfigRef.current.content;
    return typeof current === "function" ? current(props) : current;
  }, []);

  const resolvePopoverProps = useCallback(() => {
    const latest = latestConfigRef.current;
    return {
      anchor: resolveAnchorElement(),
      content: renderLiveContent,
      side: latest.side,
      className: latest.className,
      offset: latest.offset,
      arrow: latest.arrow,
      style: latest.style,
      onOpenStateChange: latest.onOpenStateChange,
    };
  }, [renderLiveContent, resolveAnchorElement]);

  const handleActivate = useEffectEvent(() => {
    if (disabled) return;

    if (isControlled) {
      const nextOpen = !controlledOpen;
      previousControlledOpenRef.current = nextOpen;
      onOpenChange?.(nextOpen);

      const props = resolvePopoverProps();
      if (!props.anchor) return;
      if (nextOpen) {
        show(props);
      } else {
        hide(props.anchor);
      }
      return;
    }

    const props = resolvePopoverProps();
    if (!props.anchor) return;
    toggle(props);
  });

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const onClick = () => handleActivate();
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  const syncControlledOpen = useEffectEvent(() => {
    if (!isControlled) return;

    const open = Boolean(controlledOpen) && !disabled;
    const wasOpen = previousControlledOpenRef.current;

    if (open && !wasOpen) {
      const props = resolvePopoverProps();
      if (!props.anchor) return;
      show(props);
    } else if (!open && wasOpen) {
      hide(resolveAnchorElement());
    }

    previousControlledOpenRef.current = open;
  });

  useEffect(() => {
    syncControlledOpen();
  }, [controlledOpen, disabled, isControlled]);

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex",
        disabled ? "pointer-events-none opacity-50" : "cursor-pointer",
        triggerClassName,
      )}
    >
      {children}
    </span>
  );
}
