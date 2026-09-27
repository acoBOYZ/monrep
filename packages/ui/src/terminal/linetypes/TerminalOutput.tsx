import { cn } from "@monrep/utils";
import type { ReactNode } from "react";

type TerminalOutputProps = {
  children?: ReactNode;
  className?: string;
};

export const TerminalOutput = ({ children, className }: TerminalOutputProps) => {
  return <div className={cn("react-terminal-line", className)}>{children}</div>;
};
