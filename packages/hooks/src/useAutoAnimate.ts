import { useEffect, useEffectEvent, useRef } from "react";
import autoAnimate from "@formkit/auto-animate";
import type { AutoAnimateOptions } from "@formkit/auto-animate";

/**
 * Adds automatic layout animations (add / remove / reorder)
 * using @formkit/auto-animate.
 *
 * Attach the returned ref to a parent element.
 * Animation is initialized once on mount.
 *
 * Examples:
 * ```tsx
 * const parentRef = useAutoAnimate()
 * const parentRef = useAutoAnimate({ duration: 150, easing: "ease-out" })
 * const parentRef = useAutoAnimate<HTMLDivElement>()
 * ```
 */
export function useAutoAnimate<TElement extends HTMLDivElement>(options?: AutoAnimateOptions) {
  const ref = useRef<TElement | null>(null);
  const getOptions = useEffectEvent(() => options);
  useEffect(() => {
    if (!ref.current) return;

    const controller = autoAnimate(ref.current, getOptions());

    return () => {
      controller.destroy?.();
    };
  }, []);

  return ref;
}
