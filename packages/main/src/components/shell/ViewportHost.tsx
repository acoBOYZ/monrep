import { useEffect, useSyncExternalStore } from "react";
import { storeEnv } from "./store.env";

const toNumber = (value: string | undefined) => {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getEffectiveViewportWidth = () => {
  if (typeof window === "undefined") return 0;

  const root = document.documentElement;
  const aiOpen = root.dataset.aiOpen === "true";
  const aiMode = root.dataset.aiMode;
  const aiPanelWidth = toNumber(root.dataset.aiPanelWidth);

  if (aiOpen && aiMode === "docked") {
    return Math.max(0, window.innerWidth - aiPanelWidth);
  }

  return window.innerWidth;
};

const getSnapshot = (breakpoint: BreakpointKey) => {
  return getEffectiveViewportWidth() <= BREAKPOINTS[breakpoint];
};

const getServerSnapshot = () => false;

const subscribe = (callback: () => void) => {
  window.addEventListener("resize", callback, { passive: true });
  window.addEventListener("ai-layout-change", callback);
  return () => {
    window.removeEventListener("resize", callback);
    window.removeEventListener("ai-layout-change", callback);
  };
};

const BREAKPOINTS = {
  xs: 360,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;
type BreakpointKey = keyof typeof BREAKPOINTS;

type ViewportProps = {
  breakpoint?: BreakpointKey;
};

export const ViewportHost = ({ breakpoint = "md" }: ViewportProps) => {
  const isMobile = useSyncExternalStore(
    subscribe,
    () => getSnapshot(breakpoint),
    getServerSnapshot,
  );

  useEffect(() => {
    storeEnv.setState((prev) => ({ ...prev, isMobile }));
  }, [isMobile]);

  return null;
};
