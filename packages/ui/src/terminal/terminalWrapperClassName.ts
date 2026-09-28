import { cn } from "@monrep/utils";

export function terminalWrapperClassName(
  isMaximized: boolean,
  fillContent: boolean,
  className: string | undefined,
): string {
  return cn(
    "react-terminal-wrapper relative box-border flex w-full flex-col overflow-hidden rounded-md border border-border bg-card pt-9 pr-3 pb-3 pl-3 font-mono text-xs text-foreground",
    isMaximized ? "fixed inset-2 z-50 w-auto shadow-lg" : "w-full",
    fillContent && "p-1 pt-9",
    className,
  );
}
