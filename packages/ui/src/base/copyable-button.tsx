import { Check, Copy } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCopy } from "@monrep/hooks";
import { cn } from "@monrep/utils";
import type { MouseEvent, ReactNode } from "react";

export interface CopyableButtonProps {
  text: string;
  /** `icon` = end affordance; `inline` = chip; `block` = children are the click target. */
  variant?: "icon" | "inline" | "block";
  disabled?: boolean;
  copiedDuration?: number;
  onCopied?: (text: string) => void;
  className?: string;
  /** Required for `block` — full surface that triggers copy. */
  children?: ReactNode;
  /**
   * Controlled pending. When set with `onCopy`, parent owns clipboard state
   * (e.g. shared `useCopy` across multiple triggers).
   */
  isPending?: boolean;
  onCopy?: (text: string) => void;
}

const CopyStatusIcon = ({ isPending, size }: { isPending: boolean; size: number }) => (
  <span className={cn("relative shrink-0", size <= 12 ? "size-3" : "size-4")}>
    <span
      className={cn(
        "absolute inset-0 flex items-center justify-center transition-all",
        isPending ? "scale-100 opacity-100" : "scale-0 opacity-0",
      )}
    >
      <HugeiconsIcon
        icon={Check}
        strokeWidth={2}
        className="text-success"
        size={size}
        aria-hidden
      />
    </span>
    <span
      className={cn(
        "absolute inset-0 flex items-center justify-center transition-all",
        isPending ? "scale-0 opacity-0" : "scale-100 opacity-100",
      )}
    >
      <HugeiconsIcon icon={Copy} strokeWidth={2} size={size} aria-hidden />
    </span>
  </span>
);

export const CopyableButton = ({
  text,
  variant = "icon",
  disabled,
  copiedDuration = 666,
  onCopied,
  className,
  children,
  isPending: isPendingControlled,
  onCopy,
}: CopyableButtonProps) => {
  const copy = useCopy(copiedDuration);
  const isControlled = isPendingControlled !== undefined && onCopy !== undefined;
  const isPending = isControlled ? isPendingControlled : copy.isPending;
  const isBlock = variant === "block";
  const isInline = variant === "inline";
  const iconSize = isInline ? 12 : 16;

  const handleCopyAction = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!isBlock) event.stopPropagation();
    if (isPending) return;
    if (isControlled) {
      onCopy(text);
    } else {
      copy.handleCopy(text);
    }
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
        isBlock
          ? "group relative flex w-full cursor-pointer items-stretch text-left"
          : isInline
            ? "inline-flex max-w-[min(100%,16rem)] items-center gap-1 rounded-md border border-border bg-muted/30 px-1.5 py-0.5 align-baseline text-[0.8125rem] leading-none font-medium text-foreground hover:bg-muted/50"
            : "absolute inset-y-0 inset-e-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 hover:text-foreground focus:z-10",
        className,
      )}
      aria-label={isPending ? "Copied" : "Copy to clipboard"}
      disabled={disabled || isPending}
    >
      {isBlock ? children : null}
      {isInline ? <span className="min-w-0 truncate">{text}</span> : null}
      {isBlock ? (
        <span className="pointer-events-none absolute inset-y-0 inset-e-0 flex w-9 items-center justify-center opacity-80 group-hover:opacity-100">
          <CopyStatusIcon isPending={isPending} size={iconSize} />
        </span>
      ) : (
        <CopyStatusIcon isPending={isPending} size={iconSize} />
      )}
    </button>
  );
};
