import { ArrowRight01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@monrep/utils";
import type { PropsWithChildren, ReactNode } from "react";

type TerminalInputProps = PropsWithChildren<{
  prompt?: ReactNode;
  className?: string;
}>;

const isEmptyChildren = (children: ReactNode) => {
  if (children == null || children === false) return true;
  if (typeof children === "string") return children.trim().length === 0;
  if (typeof children === "number") return false;
  return false;
};

export const TerminalInput = ({ children, prompt, className }: TerminalInputProps) => (
  <div className={cn("react-terminal-line flex items-center", className)}>
    <span
      className="react-terminal-prompt-mark shrink-0 select-none"
      data-empty={isEmptyChildren(children) ? "true" : undefined}
      aria-hidden
    >
      {prompt ? (
        <>{prompt}</>
      ) : (
        <HugeiconsIcon icon={ArrowRight01FreeIcons} className="size-3.5 -translate-x-0.5" />
      )}
    </span>
    <span className="ml-0.5 min-w-0 grow">{children}</span>
  </div>
);
