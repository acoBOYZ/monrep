import { Activity, useEffect, useId, useRef, useState } from "react";
import { useCopy } from "@monrep/hooks";
import { cn, mergeRefs } from "@monrep/utils";
import { useHotkey } from "@tanstack/react-hotkeys";
import { StickToBottom } from "use-stick-to-bottom";
import { TerminalScrollToBottomButton } from "./components/TerminalScrollToBottomButton";
import { AddMoreTabs, TerminalTabBar } from "./components/TerminalTabBar";
import { WindowButtons } from "./components/WindowButtons";
import { TerminalActiveInput } from "./linetypes/TerminalActiveInput";
import { useTerminalLineInput } from "./useTerminalLineInput";
import { useTerminalTabs } from "./useTerminalTabs";
import "./style.css";
import type { CSSProperties } from "react";
import type { StickToBottomContext } from "use-stick-to-bottom";
import type { TerminalChrome, TerminalProps } from "./types";

export type { TerminalChrome, TerminalProps, TerminalTabSpec } from "./types";

export const Terminal = ({
  name,
  prompt,
  pathLabel = "~",
  clockLabel,
  height = "420px",
  className,
  onInput,
  onClear,
  children,
  startingInputValue = "",
  passwordField = false,
  chrome: chromeControlled,
  defaultChrome = "normal",
  onChromeChange,
  onMaximize,
  TopButtonsPanel = WindowButtons,
  tabs: controlledTabs,
  activeTabId: controlledActiveTabId,
  onActiveTabChange,
  onTabAdd,
  onTabClose,
}: TerminalProps) => {
  const reactId = useId();
  const [chromeUncontrolled, setChromeUncontrolled] = useState<TerminalChrome>(defaultChrome);
  const isChromeControlled = chromeControlled !== undefined;
  const chrome = isChromeControlled ? chromeControlled : chromeUncontrolled;
  const isMaximized = chrome === "maximized";
  const { handleCopy } = useCopy();
  const stickContextRef = useRef<StickToBottomContext>(null);

  const {
    isTabsControlled,
    tabs,
    activeTabId,
    activeUsesChildren,
    handleSelectTab,
    handleAddTab,
    handleCloseTab,
  } = useTerminalTabs({
    controlledTabs,
    controlledActiveTabId,
    onActiveTabChange,
    onTabAdd,
    onTabClose,
  });

  const hasMoreThanOneTab = tabs.length > 1;

  const historyKey = [
    name ? `terminal-history-${name}` : "terminal-history",
    activeTabId || "default",
  ].join("-");

  const handleAfterSubmit = () => {
    void stickContextRef.current?.scrollToBottom("instant");
  };

  const {
    currentLineInput,
    cursorPos,
    resetEphemeralInput,
    handleLineInputChange,
    handleLineKeyDown,
  } = useTerminalLineInput({
    historyKey,
    startingInputValue,
    onInput,
    onAfterSubmit: handleAfterSubmit,
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [hotkeyTarget, setHotkeyTarget] = useState<HTMLDivElement | null>(null);

  useHotkey(
    "Mod+K",
    (event) => {
      event.preventDefault();
      onClear?.();
    },
    {
      target: hotkeyTarget,
      enabled: typeof onClear === "function",
      ignoreInputs: false,
    },
  );

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

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (wrapper == null || onInput == null) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("button, [role='tab'], [role='tablist']")
      ) {
        return;
      }
      hiddenInputRef.current?.focus();
    };
    wrapper.addEventListener("click", handleClick);
    return () => wrapper.removeEventListener("click", handleClick);
  }, [onInput]);

  useEffect(() => {
    const body = bodyRef.current;
    if (body == null) return;

    const copySelection = () => {
      const selection = window.getSelection();
      if (selection == null || selection.isCollapsed || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      if (!body.contains(range.commonAncestorContainer)) return;
      const text = selection.toString();
      if (text.trim().length === 0) return;
      handleCopy(text);
    };

    body.addEventListener("mouseup", copySelection);
    body.addEventListener("keyup", copySelection);
    return () => {
      body.removeEventListener("mouseup", copySelection);
      body.removeEventListener("keyup", copySelection);
    };
  }, [handleCopy]);

  const setChrome = (next: TerminalChrome) => {
    if (!isChromeControlled) setChromeUncontrolled(next);
    onChromeChange?.(next);
  };

  const handleMaximize = () => {
    setChrome(chrome === "maximized" ? "normal" : "maximized");
    onMaximize?.();
  };

  const handleOnTabSelect = (id: string) => {
    if (id !== activeTabId) resetEphemeralInput();
    handleSelectTab(id);
  };

  const handleOnTabAdd = () => {
    resetEphemeralInput();
    handleAddTab();
  };

  const handleOnTabClose = (id: string) => {
    if (id === activeTabId) resetEphemeralInput();
    handleCloseTab(id);
  };

  if (chrome === "closed") return null;

  const wrapperStyle: CSSProperties | undefined =
    chrome === "minimized" || isMaximized ? undefined : { height };

  return (
    <div
      ref={mergeRefs(wrapperRef, setHotkeyTarget)}
      className={cn(
        "react-terminal-wrapper relative box-border flex w-full flex-col overflow-hidden rounded-md border border-border bg-card pt-9 pr-3 pb-3 pl-3 font-mono text-xs text-foreground",
        isMaximized ? "fixed inset-2 z-50 w-auto shadow-lg" : "w-full",
        className,
      )}
      style={wrapperStyle}
      data-terminal-name={name}
      data-chrome={chrome}
    >
      <TopButtonsPanel
        onClose={() => undefined}
        onMinimize={() => undefined}
        onMaximize={handleMaximize}
      />
      <div className="absolute top-0.75 right-0.75">
        <AddMoreTabs onAdd={handleOnTabAdd} />
      </div>
      {hasMoreThanOneTab ? (
        <TerminalTabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelect={handleOnTabSelect}
          onClose={handleOnTabClose}
        />
      ) : null}
      {chrome !== "minimized" && (
        <StickToBottom
          className="relative min-h-0 flex-1"
          resize="instant"
          initial="instant"
          contextRef={stickContextRef}
        >
          {(ctx) => (
            <>
              <div
                ref={mergeRefs(ctx.scrollRef, bodyRef)}
                className="react-terminal h-full min-h-0 flex-1 overflow-auto"
              >
                <div ref={ctx.contentRef}>
                  {isTabsControlled
                    ? controlledTabs?.map((tab) => (
                        <Activity
                          key={tab.id}
                          name={`term-tab-${reactId}-${tab.id}`}
                          mode={tab.id === activeTabId ? "visible" : "hidden"}
                        >
                          {tab.content}
                        </Activity>
                      ))
                    : activeUsesChildren
                      ? children
                      : null}
                  {typeof onInput === "function" && (
                    <TerminalActiveInput
                      prompt={prompt}
                      pathLabel={pathLabel}
                      clockLabel={clockLabel}
                      value={currentLineInput}
                      cursorPos={cursorPos}
                      passwordField={passwordField}
                    />
                  )}
                </div>
              </div>
              <TerminalScrollToBottomButton />
            </>
          )}
        </StickToBottom>
      )}
      {typeof onInput === "function" && (
        <input
          ref={hiddenInputRef}
          className="terminal-hidden-input"
          aria-label="Terminal input"
          value={currentLineInput}
          type={passwordField ? "password" : "text"}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={handleLineInputChange}
          onKeyDown={handleLineKeyDown}
        />
      )}
    </div>
  );
};
