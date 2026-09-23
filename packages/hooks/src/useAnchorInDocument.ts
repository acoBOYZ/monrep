import { useCallback, useSyncExternalStore } from "react";

const EMPTY_UNSUBSCRIBE = () => {};

export function useAnchorInDocument(anchor: HTMLElement | null): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof document === "undefined" || !anchor) return EMPTY_UNSUBSCRIBE;
      const observer = new MutationObserver(onStoreChange);
      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    },
    [anchor],
  );

  const getSnapshot = useCallback(
    () => Boolean(anchor && document.body.contains(anchor)),
    [anchor],
  );

  const getServerSnapshot = useCallback(() => Boolean(anchor), [anchor]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
