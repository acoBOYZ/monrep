import { useImperativeHandle, useRef } from "react";
import { CircleX, SearchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@monrep/utils";
import { useSearchDraft } from "./search-input.hooks";
import type { ChangeEvent, InputHTMLAttributes, Ref } from "react";

export interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "defaultValue"
> {
  ref?: Ref<HTMLInputElement>;
  parentClass?: string;
  clearable?: boolean;
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onDebouncedValueChange?: (value: string) => void;
  debounce?: number;
}

export const SearchInput = ({
  ref,
  parentClass,
  className,
  clearable = true,
  value,
  defaultValue = "",
  onValueChange,
  onDebouncedValueChange,
  debounce = 0,
  ...props
}: SearchInputProps) => {
  const { current, commit } = useSearchDraft(
    value,
    defaultValue,
    onValueChange,
    onDebouncedValueChange,
    debounce,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current!, []);

  return (
    <div className={cn("relative w-full", parentClass)}>
      <HugeiconsIcon
        icon={SearchIcon}
        className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 opacity-70"
        size={16}
        strokeWidth={1.8}
        aria-hidden
      />

      <input
        ref={inputRef}
        value={current}
        onChange={(e: ChangeEvent<HTMLInputElement>) => commit(e.target.value)}
        className={cn(
          "flex min-h-9 w-full rounded-md border border-input bg-transparent",
          "py-1 pr-10 pl-8 text-sm shadow-none",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-xs placeholder:text-muted-foreground/50",
          "focus:placeholder:opacity-0 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />

      {clearable && current !== "" && (
        <button
          type="button"
          onClick={() => {
            commit("", true);
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 opacity-70 hover:opacity-100"
        >
          <HugeiconsIcon icon={CircleX} className="size-4" />
        </button>
      )}
    </div>
  );
};
