import { useState } from "react";
import type { RefObject } from "react";

/**
 * Mutable ref whose `.current` is created once, on mount.
 *
 * `factory` runs inside `useState`'s lazy initializer, so it is not
 * invoked again on later renders. The returned `RefObject` identity is
 * also stable for the lifetime of the component.
 *
 * Prefer this over `useRef(factory())` when construction is not free
 * (`new Map()`, `new Set()`, `AbortController`, etc.): that form still
 * calls `factory` every render and discards the extra instances. Prefer
 * this over `if (!ref.current) ref.current = factory()` as well — that
 * pattern reads and writes the ref during render, which the React
 * Compiler forbids.
 *
 * `factory` is a first-mount snapshot. It does not re-run when props or
 * other render values change. Read and write `.current` only in effects
 * and event handlers, never during render.
 *
 * @example
 * ```ts
 * const abortControllers = useLazyRef(() => new Set<AbortController>());
 *
 * useEffect(() => {
 *   return () => {
 *     for (const controller of abortControllers.current) controller.abort();
 *   };
 * }, [abortControllers]);
 * ```
 */
export function useLazyRef<T>(factory: () => T): RefObject<T> {
  const [ref] = useState(() => ({ current: factory() }));
  return ref;
}
