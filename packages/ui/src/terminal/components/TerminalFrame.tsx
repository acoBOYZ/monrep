import { mergeRefs } from "@monrep/utils";
import { TerminalFillPane, TerminalStickPane } from "./TerminalPanes";
import { AddMoreTabs, TerminalTabBar } from "./TerminalTabBar";
import type {
  CSSProperties,
  ChangeEvent,
  KeyboardEvent,
  ReactElement,
  ReactNode,
  RefObject,
} from "react";
import type { StickToBottomContext } from "use-stick-to-bottom";
import type { TerminalChrome, TerminalTabSpec } from "../types";
import type { WindowButtonsProps } from "./WindowButtons";

const VOID_FN = () => undefined;

type TerminalFrameProps = {
  wrapperRef: RefObject<HTMLDivElement | null>;
  setHotkeyTarget: (node: HTMLDivElement | null) => void;
  bodyRef: RefObject<HTMLDivElement | null>;
  hiddenInputRef: RefObject<HTMLInputElement | null>;
  stickContextRef: RefObject<StickToBottomContext | null>;
  name?: string;
  className?: string;
  chrome: TerminalChrome;
  fillContent: boolean;
  wrapperStyle: CSSProperties | undefined;
  TopButtonsPanel: (props: WindowButtonsProps) => ReactElement | null;
  onMaximize: () => void;
  showAddTabs: boolean;
  showTabBar: boolean;
  tabs: Array<{ id: string; title: string }>;
  activeTabId: string;
  onTabSelect: (id: string) => void;
  onTabAdd: () => void;
  onTabClose: (id: string) => void;
  showBody: boolean;
  reactId: string;
  isTabsControlled: boolean;
  controlledTabs: Array<TerminalTabSpec> | undefined;
  activeUsesChildren: boolean;
  children: ReactNode;
  isOnInputFunction: boolean;
  prompt?: ReactNode;
  pathLabel: string;
  clockLabel?: string;
  currentLineInput: string;
  cursorPos: number;
  passwordField: boolean;
  onLineInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLineKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

export function TerminalFrame({
  wrapperRef,
  setHotkeyTarget,
  bodyRef,
  hiddenInputRef,
  stickContextRef,
  name,
  className,
  chrome,
  fillContent,
  wrapperStyle,
  TopButtonsPanel,
  onMaximize,
  showAddTabs,
  showTabBar,
  tabs,
  activeTabId,
  onTabSelect,
  onTabAdd,
  onTabClose,
  showBody,
  reactId,
  isTabsControlled,
  controlledTabs,
  activeUsesChildren,
  children,
  isOnInputFunction,
  prompt,
  pathLabel,
  clockLabel,
  currentLineInput,
  cursorPos,
  passwordField,
  onLineInputChange,
  onLineKeyDown,
}: TerminalFrameProps) {
  return (
    <div
      ref={mergeRefs(wrapperRef, setHotkeyTarget)}
      className={className}
      style={wrapperStyle}
      data-terminal-name={name}
      data-chrome={chrome}
    >
      <TopButtonsPanel onClose={VOID_FN} onMinimize={VOID_FN} onMaximize={onMaximize} />
      {showAddTabs ? (
        <div className="absolute top-0.75 right-0.75">
          <AddMoreTabs onAdd={onTabAdd} />
        </div>
      ) : null}
      {showTabBar ? (
        <TerminalTabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelect={onTabSelect}
          onClose={onTabClose}
        />
      ) : null}
      {showBody && fillContent ? (
        <TerminalFillPane
          bodyRef={bodyRef}
          isTabsControlled={isTabsControlled}
          controlledTabs={controlledTabs}
          activeTabId={activeTabId}
        >
          {children}
        </TerminalFillPane>
      ) : null}
      {showBody && !fillContent ? (
        <TerminalStickPane
          reactId={reactId}
          bodyRef={bodyRef}
          stickContextRef={stickContextRef}
          isTabsControlled={isTabsControlled}
          controlledTabs={controlledTabs}
          activeTabId={activeTabId}
          activeUsesChildren={activeUsesChildren}
          isOnInputFunction={isOnInputFunction}
          prompt={prompt}
          pathLabel={pathLabel}
          clockLabel={clockLabel}
          currentLineInput={currentLineInput}
          cursorPos={cursorPos}
          passwordField={passwordField}
        >
          {children}
        </TerminalStickPane>
      ) : null}
      {isOnInputFunction ? (
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
          onChange={onLineInputChange}
          onKeyDown={onLineKeyDown}
        />
      ) : null}
    </div>
  );
}
