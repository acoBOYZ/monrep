import { ArrowRight01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { storeTimer } from "@monrep/runtime";
import { useSelector } from "@tanstack/react-store";
import type { ReactNode } from "react";

const CURSOR_POSITION_OFFSET_PX = 1;

type TerminalActiveInputProps = {
  prompt?: ReactNode;
  pathLabel?: string;
  /** Preformatted clock from app TimerEnv / timerStore (e.g. `23:56:33`). */
  clockLabel?: string;
  value: string;
  cursorPos: number;
  passwordField?: boolean;
};

export const TerminalActiveInput = ({
  prompt,
  pathLabel = "~",
  clockLabel,
  value,
  cursorPos,
  passwordField = false,
}: TerminalActiveInputProps) => {
  return (
    <div className="mt-0.5">
      <div className="flex items-center gap-1.5">
        <span className="react-terminal-prompt-elbow shrink-0 select-none" aria-hidden>
          ╭─
        </span>
        <div className="react-terminal-path select-none">{pathLabel}</div>
      </div>
      <div className="flex min-w-0 items-center">
        <span className="react-terminal-prompt-elbow shrink-0 select-none" aria-hidden>
          ╰─
        </span>
        <span className="react-terminal-prompt-mark shrink-0 select-none" aria-hidden>
          {prompt ? (
            <>{prompt}</>
          ) : (
            <HugeiconsIcon icon={ArrowRight01FreeIcons} className="size-3.5 -translate-x-1" />
          )}
        </span>
        <span className="react-terminal-line react-terminal-active-input min-w-0 grow">
          {passwordField ? "*".repeat(value.length) : value}
          <span className="cursor" style={{ left: `${cursorPos + CURSOR_POSITION_OFFSET_PX}px` }} />
        </span>
        <TerminalActiveInputClock clockLabel={clockLabel} />
      </div>
    </div>
  );
};

type TerminalActiveInputClockProps = {
  clockLabel?: string;
};

const TerminalActiveInputClock = ({ clockLabel }: TerminalActiveInputClockProps) => {
  const internalClockLabel = useSelector(storeTimer, (s) => s.clockLabel);
  const resolvedClockLabel = clockLabel ?? internalClockLabel;

  if (!resolvedClockLabel) return null;

  return (
    <span className="react-terminal-clock ml-auto shrink-0 tabular-nums select-none">
      {resolvedClockLabel}
    </span>
  );
};
