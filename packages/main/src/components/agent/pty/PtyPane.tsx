import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef } from "react";
import { storeTheme } from "@monrep/runtime";
import { bytesToBase64 } from "@monrep/utils";
import { nextUlid } from "@monrep/utils/ulid";
import { useSelector } from "@tanstack/react-store";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal as XTerm } from "@xterm/xterm";
import type { PaneApi } from "./ptyTypes";
import { useSessionWs } from "@/components/agent/session-ws/useSessionWs";

function readThemeColor(varName: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return raw || fallback;
}

function ptyThemeFromTokens() {
  return {
    background: readThemeColor("--background", "var(--color-background)"),
    foreground: readThemeColor("--foreground", "var(--color-foreground)"),
    cursor: readThemeColor("--foreground", "var(--color-foreground)"),
    selectionBackground: readThemeColor("--muted", "var(--color-muted)"),
  };
}

type PtyPaneProps = {
  wsReady: boolean;
};

export function PtyPane({ wsReady }: PtyPaneProps) {
  const { send, setPane } = useSessionWs();
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const ptyIdRef = useRef<string | null>(null);
  const apiRef = useRef<PaneApi | null>(null);
  const effectiveTheme = useSelector(storeTheme, (s) => s.effectiveTheme);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      theme: ptyThemeFromTokens(),
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    term.attachCustomKeyEventHandler((e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && e.type === "keydown") {
        e.preventDefault();
        term.clear();
        return false;
      }
      return true;
    });

    const fitAndResize = () => {
      fit.fit();
      const ptyId = ptyIdRef.current;
      if (!ptyId) return;
      send({
        v: 1,
        id: nextUlid(null),
        op: "pty.resize",
        body: { pty_id: ptyId, cols: term.cols, rows: term.rows },
      });
    };

    const api: PaneApi = {
      write: (bytes) => term.write(bytes),
      clear: () => term.clear(),
      fitAndResize,
      writeln: (line) => term.writeln(line),
      getPtyId: () => ptyIdRef.current,
    };
    apiRef.current = api;
    setPane(api);

    const dataDisp = term.onData((data) => {
      const ptyId = ptyIdRef.current;
      if (!ptyId) return;
      send({
        v: 1,
        id: nextUlid(null),
        op: "pty.data",
        body: { pty_id: ptyId, data: bytesToBase64(new TextEncoder().encode(data)) },
      });
    });

    const ro = new ResizeObserver(() => {
      if (host.clientWidth === 0 || host.clientHeight === 0) return;
      fitAndResize();
    });
    ro.observe(host);
    window.addEventListener("resize", fitAndResize);

    return () => {
      window.removeEventListener("resize", fitAndResize);
      ro.disconnect();
      dataDisp.dispose();
      const ptyId = ptyIdRef.current;
      if (ptyId) {
        send({
          v: 1,
          id: nextUlid(null),
          op: "pty.close",
          body: { pty_id: ptyId },
        });
      }
      setPane(null);
      apiRef.current = null;
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
      ptyIdRef.current = null;
    };
  }, [send, setPane]);

  useEffect(() => {
    if (!wsReady || !termRef.current || !fitRef.current) return;
    if (ptyIdRef.current) return;

    const term = termRef.current;
    const fit = fitRef.current;
    const api = apiRef.current;
    if (!api) return;

    setPane(api);
    fit.fit();
    const openId = nextUlid(null);
    const ok = send({
      v: 1,
      id: openId,
      op: "pty.open",
      body: { cols: term.cols, rows: term.rows },
    });
    if (ok) ptyIdRef.current = openId;
  }, [wsReady, send, setPane]);

  useEffect(() => {
    requestAnimationFrame(() => {
      apiRef.current?.fitAndResize();
    });
  }, []);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.theme = ptyThemeFromTokens();
  }, [effectiveTheme]);

  return <div ref={hostRef} className="absolute inset-0 h-full min-h-0 w-full overflow-hidden" />;
}
