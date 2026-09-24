import { useEffect, useSyncExternalStore } from "react";
import { setTimerNow } from "./store.timer";

const MINUTE_MS = 1_000;
const TIMER_JITTER_PADDING_MS = 12;

let timeoutId: number | null = null;

const getDelayToNextMinute = (timestamp: number) => {
  const remainder = timestamp % MINUTE_MS;
  return remainder === 0 ? MINUTE_MS : MINUTE_MS - remainder;
};

const clearTick = () => {
  if (timeoutId === null) return;
  window.clearTimeout(timeoutId);
  timeoutId = null;
};

const scheduleNextTick = () => {
  const now = Date.now();
  const delay = getDelayToNextMinute(now) + TIMER_JITTER_PADDING_MS;

  timeoutId = window.setTimeout(() => {
    setTimerNow(Date.now());
    scheduleNextTick();
  }, delay);
};

const restartTick = () => {
  clearTick();
  setTimerNow(Date.now());
  scheduleNextTick();
};

const handleVisibilityChange = () => {
  return document.visibilityState === "visible";
};

const handleFocus = () => {
  return document.visibilityState === "visible";
};

const getServerSnapshot = () => {
  return false;
};

const subscribe = (callback: () => void) => {
  window.addEventListener("visibilitychange", callback);
  window.addEventListener("focus", callback);
  return () => {
    window.removeEventListener("visibilitychange", callback);
    window.removeEventListener("focus", callback);
  };
};

export const TimerEnv = () => {
  const isVisible = useSyncExternalStore(subscribe, handleVisibilityChange, getServerSnapshot);
  const isFocused = useSyncExternalStore(subscribe, handleFocus, getServerSnapshot);

  useEffect(() => {
    if (!isVisible || !isFocused) {
      clearTick();
      return;
    }

    restartTick();
  }, [isVisible, isFocused]);

  return null;
};
