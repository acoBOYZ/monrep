import type { Ref } from "react";

/**
 * Merge multiple refs into a single ref.
 * @param refs - The refs to merge.
 * @returns The merged ref.
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | null | undefined>) {
  return (value: T | null) => {
    const cleanups: Array<(() => void) | void> = [];

    for (const ref of refs) {
      if (!ref) continue;

      if (typeof ref === "function") {
        const cleanup = ref(value);
        cleanups.push(cleanup);
      } else {
        ref.current = value;
      }
    }

    return () => {
      for (const fn of cleanups) fn?.();

      for (const ref of refs) {
        if (!ref || typeof ref === "function") continue;
        ref.current = null;
      }
    };
  };
}
