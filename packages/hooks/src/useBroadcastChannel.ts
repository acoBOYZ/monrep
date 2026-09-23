import { useCallback, useEffect, useEffectEvent } from "react";

const canUseBroadcastChannel = () =>
  typeof window !== "undefined" && typeof BroadcastChannel !== "undefined";

/**
 * Subscribe to a BroadcastChannel; returns a `post` that opens → postMessage → close.
 * No-ops when BroadcastChannel is unavailable (SSR / unsupported).
 */
export function useBroadcastChannel<T>(
  name: string,
  onMessage: (data: T) => void,
): (data: T) => void {
  const handle = useEffectEvent(onMessage);

  useEffect(() => {
    if (!canUseBroadcastChannel()) return;

    const channel = new BroadcastChannel(name);
    channel.onmessage = (event: MessageEvent<T>) => {
      handle(event.data);
    };

    return () => {
      channel.close();
    };
  }, [name]);

  return useCallback(
    (data: T) => {
      if (!canUseBroadcastChannel()) return;
      const channel = new BroadcastChannel(name);
      channel.postMessage(data);
      channel.close();
    },
    [name],
  );
}
