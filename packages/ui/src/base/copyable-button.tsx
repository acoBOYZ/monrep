import { Check, Copy } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCopy } from "@monrep/hooks";
import { cn } from "@monrep/utils";
import type { MouseEvent } from "react";

export interface CopyableButtonProps {
  text: string;
  variant?: "icon" | "inline";
  disabled?: boolean;
  copiedDuration?: number;
  onCopied?: (text: string) => void;
  className?: string;
}

export const CopyableButton = ({
  text,
  variant = "icon",
  disabled,
  copiedDuration = 666,
  onCopied,
  className,
}: CopyableButtonProps) => {
  const { isPending, handleCopy } = useCopy(copiedDuration);
  const isInline = variant === "inline";
  const iconSize = isInline ? 12 : 16;

  const handleCopyAction = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isPending) return;
    handleCopy(text);
    onCopied?.(text);
  };

  return (
    <button
      type="button"
      onClick={handleCopyAction}
      className={cn(
        "transition-[color,box-shadow] outline-none focus-visible:ring-[3px]",
        "focus-visible:border-ring focus-visible:ring-ring/50",
        disabled ? "pointer-events-none cursor-not-allowed opacity-50" : "",
        isInline
          ? "inline-flex max-w-[min(100%,16rem)] items-center gap-1 rounded-md border border-border bg-muted/30 px-1.5 py-0.5 align-baseline text-[0.8125rem] leading-none font-medium text-foreground hover:bg-muted/50"
          : "absolute inset-y-0 inset-e-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 hover:text-foreground focus:z-10",
        className,
      )}
      aria-label={isPending ? "Copied" : "Copy to clipboard"}
      disabled={disabled || isPending}
    >
      {isInline ? <span className="min-w-0 truncate">{text}</span> : null}
      <span className={cn("relative shrink-0", isInline ? "size-3" : "size-4")}>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-all",
            isPending ? "scale-100 opacity-100" : "scale-0 opacity-0",
          )}
        >
          <HugeiconsIcon icon={Check} className="stroke-emerald-500" size={iconSize} aria-hidden />
        </span>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-all",
            isPending ? "scale-0 opacity-0" : "scale-100 opacity-100",
          )}
        >
          <HugeiconsIcon icon={Copy} size={iconSize} aria-hidden />
        </span>
      </span>
    </button>
  );
};
