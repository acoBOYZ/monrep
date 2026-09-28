import { useId, useRef, useState } from "react";
import { useCopy } from "@monrep/hooks";
import { useHotkey } from "@tanstack/react-hotkeys";
import { TerminalFrame } from "./components/TerminalFrame";
import { WindowButtons } from "./components/WindowButtons";
import { terminalWrapperClassName } from "./terminalWrapperClassName";
import { useTerminalBodyInteractions } from "./useTerminalBodyInteractions";
import { useTerminalChrome } from "./useTerminalChrome";
import { useTerminalLineInput } from "./useTerminalLineInput";
import { useTerminalTabs } from "./useTerminalTabs";
import "./style.css";
import type { CSSProperties } from "react";
import type { StickToBottomContext } from "use-stick-to-bottom";
import type { TerminalProps } from "./types";

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
  fillContent = false,
}: TerminalProps) => {
  const reactId = useId();
  const { handleCopy } = useCopy();
  const stickContextRef = useRef<StickToBottomContext>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [hotkeyTarget, setHotkeyTarget] = useState<HTMLDivElement | null>(null);

  const { chrome, isMaximized, handleMaximize } = useTerminalChrome({
    chromeControlled,
    defaultChrome,
    onChromeChange,
    onMaximize,
  });

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

  const historyKey = [
    name ? `terminal-history-${name}` : "terminal-history",
    activeTabId || "default",
  ].join("-");

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
    onAfterSubmit: () => {
      void stickContextRef.current?.scrollToBottom("instant");
    },
  });

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

  useHotkey(
    "Mod+J",
    (event) => {
      event.preventDefault();
      handleMaximize();
    },
    {
      target: hotkeyTarget,
      ignoreInputs: false,
    },
  );

  useTerminalBodyInteractions({
    wrapperRef,
    bodyRef,
    hiddenInputRef,
    onInput: onInput ?? undefined,
    handleCopy,
  });

  const handleTabSelect = (id: string) => {
    if (id !== activeTabId) resetEphemeralInput();
    handleSelectTab(id);
  };

  const handleTabAdd = () => {
    resetEphemeralInput();
    handleAddTab();
  };

  const handleTabClose = (id: string) => {
    if (id === activeTabId) resetEphemeralInput();
    handleCloseTab(id);
  };

  if (chrome === "closed") return null;

  const wrapperStyle: CSSProperties | undefined =
    chrome === "minimized" || isMaximized ? undefined : { height };

  return (
    <TerminalFrame
      wrapperRef={wrapperRef}
      setHotkeyTarget={setHotkeyTarget}
      bodyRef={bodyRef}
      hiddenInputRef={hiddenInputRef}
      stickContextRef={stickContextRef}
      name={name}
      className={terminalWrapperClassName(isMaximized, fillContent, className)}
      chrome={chrome}
      fillContent={fillContent}
      wrapperStyle={wrapperStyle}
      TopButtonsPanel={TopButtonsPanel}
      onMaximize={handleMaximize}
      showAddTabs={!fillContent}
      showTabBar={!fillContent && tabs.length > 1}
      tabs={tabs}
      activeTabId={activeTabId}
      onTabSelect={handleTabSelect}
      onTabAdd={handleTabAdd}
      onTabClose={handleTabClose}
      showBody={chrome !== "minimized"}
      reactId={reactId}
      isTabsControlled={isTabsControlled}
      controlledTabs={controlledTabs}
      activeUsesChildren={activeUsesChildren}
      isOnInputFunction={typeof onInput === "function"}
      prompt={prompt}
      pathLabel={pathLabel}
      clockLabel={clockLabel}
      currentLineInput={currentLineInput}
      cursorPos={cursorPos}
      passwordField={passwordField}
      onLineInputChange={handleLineInputChange}
      onLineKeyDown={handleLineKeyDown}
    >
      {children}
    </TerminalFrame>
  );
};
