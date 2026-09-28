import { useEffect, useImperativeHandle, useRef } from "react";
import { CircleX, SearchIcon, X } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@monrep/utils";
import { useSearchDraft } from "./search-input.hooks";
import type { InputHTMLAttributes, KeyboardEvent, ReactNode, Ref } from "react";

export type TokenSearchToken = {
  id: string;
  label: string;
  prefix?: string;
  icon?: ReactNode;
};

export interface TokenSearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "defaultValue" | "size"
> {
  ref?: Ref<HTMLInputElement>;
  tokens: ReadonlyArray<TokenSearchToken>;
  onTokenRemove: (id: string) => void;
  parentClass?: string;
  clearable?: boolean;
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onDebouncedValueChange?: (value: string) => void;
  debounce?: number;
  /** Called when clear wipes text and tokens (in addition to emptying value). */
  onClearAll?: () => void;
  tokenClassName?: string;
}

export const TokenSearchInput = ({
  ref,
  tokens,
  onTokenRemove,
  parentClass,
  className,
  clearable = true,
  value,
  defaultValue = "",
  onValueChange,
  onDebouncedValueChange,
  debounce = 0,
  onClearAll,
  tokenClassName,
  placeholder,
  ...props
}: TokenSearchInputProps) => {
  const { current, commit } = useSearchDraft(
    value,
    defaultValue,
    onValueChange,
    onDebouncedValueChange,
    debounce,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => inputRef.current!, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [tokens.length, current]);

  const showClear = clearable && (current !== "" || tokens.length > 0);
  const showPlaceholder = current === "" && tokens.length === 0;

  return (
    <div className={cn("relative h-9 w-full", parentClass)}>
      <div
        ref={scrollRef}
        className={cn(
          "flex h-9 w-full cursor-text flex-nowrap items-center gap-1 overflow-x-auto overflow-y-hidden",
          "rounded-md border border-input bg-transparent py-1 pr-10 pl-8 shadow-none",
          "focus-within:outline-none",
        )}
      >
        {tokens.map((token) => (
          <button
            key={token.id}
            type="button"
            className={cn(
              "group/token inline-flex h-5.5 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11px] leading-none",
              "border border-border/70 bg-accent/60 text-accent-foreground transition-colors",
              "hover:border-destructive/40 hover:bg-destructive/10",
              "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
              tokenClassName,
            )}
            onClick={() => onTokenRemove(token.id)}
            aria-label={`Remove ${token.prefix ?? ""}${token.label}`}
            title={`${token.prefix ?? ""}${token.label}`}
          >
            {token.icon ? (
              <span className="inline-flex shrink-0 items-center justify-center" aria-hidden>
                {token.icon}
              </span>
            ) : (
              token.prefix && <span className="shrink-0 text-cool">{token.prefix}</span>
            )}
            <span className="max-w-32 truncate font-medium">{token.label}</span>
            <HugeiconsIcon
              icon={X}
              className="size-2.5 shrink-0 text-cool transition-colors group-hover/token:text-destructive"
            />
          </button>
        ))}

        <input
          ref={inputRef}
          value={current}
          onChange={(e) => commit(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key !== "Backspace" || current.length > 0 || tokens.length === 0) return;
            e.preventDefault();
            const last = tokens[tokens.length - 1];
            if (last) onTokenRemove(last.id);
          }}
          placeholder={showPlaceholder ? placeholder : undefined}
          className={cn(
            "min-w-24 flex-1 border-0 bg-transparent py-0.5 text-sm shadow-none outline-none",
            "placeholder:text-xs placeholder:text-muted-foreground/50",
            "focus:placeholder:opacity-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
      </div>

      <span
        className="pointer-events-none absolute inset-y-px left-px z-10 flex w-7.25 items-center justify-center"
        aria-hidden
      >
        <HugeiconsIcon icon={SearchIcon} className="opacity-70" size={16} strokeWidth={1.8} />
      </span>

      {showClear && (
        <span className="absolute inset-y-px right-px z-10 flex w-7.25 items-center justify-center">
          <button
            type="button"
            onClick={() => {
              commit("", true);
              onClearAll?.();
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="opacity-70 hover:opacity-100"
          >
            <HugeiconsIcon icon={CircleX} className="size-4" />
          </button>
        </span>
      )}
    </div>
  );
};
