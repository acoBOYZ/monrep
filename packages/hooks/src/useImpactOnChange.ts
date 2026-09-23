import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { AnimationEvent } from "react";

export type TImpactValue = string | number | boolean | null | undefined;

const replayImpact = (el: HTMLElement, animationName: string) => {
  el.classList.remove(animationName);
  void el.offsetWidth;
  el.classList.add(animationName);
};

/**
 * One-shot CSS class splash when `value` changes after mount (safe with
 * virtualized remounts). Toggles `animationName` on the node — no React
 * state for the animation. Pass `flashOnMount` only for non-recycled
 * surfaces that should splash on first paint when `value != null`.
 * Attach `ref` and `handleImpactAnimationEnd` to the animated element.
 */
export function useImpactOnChange(
  value: TImpactValue,
  animationName: string,
  flashOnMount?: boolean,
) {
  const shouldFlashOnMount = flashOnMount === true;
  const [impactNode, setImpactNode] = useState<HTMLElement | null>(null);
  const prevValueRef = useRef<TImpactValue | undefined>(undefined);
  const mountedRef = useRef(false);
  const animationNameRef = useRef(animationName);

  useLayoutEffect(() => {
    animationNameRef.current = animationName;
  }, [animationName]);

  useLayoutEffect(() => {
    if (!impactNode) return;
    const name = animationNameRef.current;

    if (!mountedRef.current) {
      mountedRef.current = true;
      prevValueRef.current = value;
      if (shouldFlashOnMount && value != null) replayImpact(impactNode, name);
      return;
    }

    if (prevValueRef.current === value) return;
    prevValueRef.current = value;
    if (value != null) replayImpact(impactNode, name);
  }, [impactNode, value, shouldFlashOnMount]);

  const handleImpactAnimationEnd = useCallback((event: AnimationEvent<HTMLElement>) => {
    const name = animationNameRef.current;
    if (event.animationName !== name) return;
    event.currentTarget.classList.remove(name);
  }, []);

  return { ref: setImpactNode, handleImpactAnimationEnd };
}
