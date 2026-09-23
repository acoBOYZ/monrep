import { useEffect, useEffectEvent } from "react";
import type { RefObject } from "react";

type EventType = "mousedown" | "mouseup" | "touchstart" | "touchend" | "focusin" | "focusout";

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null> | Array<RefObject<T | null>>,
  handler: (event: Event) => void,
  eventType: EventType = "mousedown",
): void {
  const callback = useEffectEvent((event: Event) => {
    const target = event.target as Node | null;
    if (!target || !target.isConnected) {
      return;
    }

    const isOutside = Array.isArray(ref)
      ? ref.every((r) => r.current && !r.current.contains(target))
      : ref.current && !ref.current.contains(target);

    if (isOutside) {
      handler(event);
    }
  });

  useEffect(() => {
    window.addEventListener(eventType, callback);

    return () => {
      window.removeEventListener(eventType, callback);
    };
  }, [eventType]);
}
