import type { ReactElement, ReactNode } from "react";
import type { WindowButtonsProps } from "./components/WindowButtons";

export type TerminalChrome = "normal" | "minimized" | "maximized" | "closed";

export type TerminalTabSpec = {
  id: string;
  title: string;
  content: ReactNode;
};

export type TerminalProps = {
  name?: string;
  prompt?: ReactNode;
  /** Path shown above the active Warp-style prompt (default `~`). */
  pathLabel?: string;
  /** Preformatted clock from app TimerEnv (e.g. `23:56:33`). */
  clockLabel?: string;
  height?: string;
  className?: string;
  children?: ReactNode;
  onInput?: ((input: string) => void) | null;
  onClear?: () => void;
  startingInputValue?: string;
  passwordField?: boolean;
  chrome?: TerminalChrome;
  defaultChrome?: TerminalChrome;
  onChromeChange?: (chrome: TerminalChrome) => void;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  TopButtonsPanel?: (props: WindowButtonsProps) => ReactElement | null;
  /** Controlled tabs — when set, host owns tab list / content. */
  tabs?: Array<TerminalTabSpec>;
  activeTabId?: string;
  onActiveTabChange?: (id: string) => void;
  onTabAdd?: () => void;
  onTabClose?: (id: string) => void;
  /** Stretch tab/children body to fill the chrome (e.g. xterm PTY). */
  fillContent?: boolean;
};
