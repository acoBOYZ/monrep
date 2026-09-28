import { Activity, useLayoutEffect } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { TerminalActiveInput } from "../linetypes/TerminalActiveInput";
import { TerminalScrollToBottomButton } from "./TerminalScrollToBottomButton";
import type { ReactNode, RefObject } from "react";
import type { StickToBottomContext } from "use-stick-to-bottom";
import type { TerminalTabSpec } from "../types";

/** Binds StickToBottom's scroll node to Terminal copy-selection listeners. */
function TerminalScrollCopyBind({ bodyRef }: { bodyRef: RefObject<HTMLDivElement | null> }) {
  const { scrollRef } = useStickToBottomContext();
  useLayoutEffect(() => {
    bodyRef.current = (scrollRef.current as HTMLDivElement | null) ?? null;
    return () => {
      bodyRef.current = null;
    };
  });
  return null;
}

type TerminalFillPaneProps = {
  bodyRef: RefObject<HTMLDivElement | null>;
  isTabsControlled: boolean;
  controlledTabs: Array<TerminalTabSpec> | undefined;
  activeTabId: string;
  children: ReactNode;
};

export function TerminalFillPane({
  bodyRef,
  isTabsControlled,
  controlledTabs,
  activeTabId,
  children,
}: TerminalFillPaneProps) {
  return (
    <div
      ref={bodyRef}
      className="react-terminal relative flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      {isTabsControlled
        ? controlledTabs?.map((tab) =>
            tab.id === activeTabId ? (
              <div key={tab.id} className="relative h-full min-h-0 w-full flex-1">
                {tab.content}
              </div>
            ) : null,
          )
        : (children ?? null)}
    </div>
  );
}

type TerminalStickPaneProps = {
  reactId: string;
  bodyRef: RefObject<HTMLDivElement | null>;
  stickContextRef: RefObject<StickToBottomContext | null>;
  isTabsControlled: boolean;
  controlledTabs: Array<TerminalTabSpec> | undefined;
  activeTabId: string;
  activeUsesChildren: boolean;
  children: ReactNode;
  isOnInputFunction: boolean;
  prompt?: ReactNode;
  pathLabel: string;
  clockLabel?: string;
  currentLineInput: string;
  cursorPos: number;
  passwordField: boolean;
};

export function TerminalStickPane({
  reactId,
  bodyRef,
  stickContextRef,
  isTabsControlled,
  controlledTabs,
  activeTabId,
  activeUsesChildren,
  children,
  isOnInputFunction,
  prompt,
  pathLabel,
  clockLabel,
  currentLineInput,
  cursorPos,
  passwordField,
}: TerminalStickPaneProps) {
  return (
    <StickToBottom
      className="relative flex min-h-0 flex-1 flex-col"
      resize="instant"
      initial="instant"
      contextRef={stickContextRef}
    >
      <TerminalScrollCopyBind bodyRef={bodyRef} />
      <StickToBottom.Content
        className="react-terminal min-h-0"
        scrollClassName="h-full min-h-0 flex-1 overflow-auto"
      >
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
      </StickToBottom.Content>
      {isOnInputFunction ? (
        <TerminalActiveInput
          prompt={prompt}
          pathLabel={pathLabel}
          clockLabel={clockLabel}
          value={currentLineInput}
          cursorPos={cursorPos}
          passwordField={passwordField}
        />
      ) : null}
      <TerminalScrollToBottomButton />
    </StickToBottom>
  );
}
