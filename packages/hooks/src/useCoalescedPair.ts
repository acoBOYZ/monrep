import { useLayoutEffect, useRef, useState } from "react";

export function useCoalescedPair<T extends object>(pair: T): T {
  const [snap, setSnap] = useState(pair);
  const latest = useRef(pair);

  useLayoutEffect(() => {
    latest.current = pair;
    const id = requestAnimationFrame(() => setSnap(latest.current));
    return () => cancelAnimationFrame(id);
  }, [pair]);
  return snap;
}
