import { useEffect, useState } from "react";
import type { TerminalChrome } from "./types";

type UseTerminalChromeArgs = {
  chromeControlled: TerminalChrome | undefined;
  defaultChrome: TerminalChrome;
  onChromeChange?: (chrome: TerminalChrome) => void;
  onMaximize?: () => void;
};

export function useTerminalChrome({
  chromeControlled,
  defaultChrome,
  onChromeChange,
  onMaximize,
}: UseTerminalChromeArgs) {
  const [chromeUncontrolled, setChromeUncontrolled] = useState<TerminalChrome>(defaultChrome);
  const isChromeControlled = chromeControlled !== undefined;
  const chrome = isChromeControlled ? chromeControlled : chromeUncontrolled;
  const isMaximized = chrome === "maximized";

  useEffect(() => {
    if (!isMaximized) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [isMaximized]);

  const setChrome = (next: TerminalChrome) => {
    if (!isChromeControlled) setChromeUncontrolled(next);
    onChromeChange?.(next);
  };

  const handleMaximize = () => {
    setChrome(chrome === "maximized" ? "normal" : "maximized");
    onMaximize?.();
  };

  return { chrome, isMaximized, handleMaximize };
}
