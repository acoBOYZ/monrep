import { useEffect, useSyncExternalStore } from "react";
import { storeEnv } from "./store.env";

const getSnapshot = () => {
  return typeof navigator !== "undefined" && navigator.onLine;
};

const getServerSnapshot = () => {
  return true;
};

const subscribe = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

export const NetworkEnv = () => {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    storeEnv.setState((prev) => ({ ...prev, isOnline }));
  }, [isOnline]);

  return null;
};
