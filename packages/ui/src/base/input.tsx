import { useId, useImperativeHandle, useRef } from "react";
import { cn } from "@monrep/utils";
import { CopyableButton } from "./copyable-button";
import type { ComponentPropsWithRef, ReactNode } from "react";
import type { CopyableButtonProps } from "./copyable-button";

export type InputProps = ComponentPropsWithRef<"input">;

const inputBaseClassName =
  "file:text-foreground placeholder:text-muted-foreground/50 selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 px-3 py-1 text-base outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";

const inputEditableClassName =
  "dark:bg-background border-input rounded-md border bg-transparent shadow-xs file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium";

const inputReadonlyClassName = "cursor-default border-0 bg-transparent shadow-none";

export const Input = ({ className, type = "text", readOnly, ...props }: InputProps) => (
  <input
    type={type}
    data-slot="input"
    readOnly={readOnly}
    className={cn(
      inputBaseClassName,
      readOnly ? inputReadonlyClassName : inputEditableClassName,
      className,
    )}
    {...props}
  />
);

/**
 * InputWithAffixes
 * Optional left/right slots with muted bg and a divider toward the input.
 * - Keeps focus ring on the whole control via :focus-within
 * - Affixes auto-dim + block pointer events when disabled
 */
export interface InputWithAffixesProps extends InputProps {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
  inputClassName?: string;
  leftClassName?: string;
  rightClassName?: string;
}

export const InputWithAffixes = ({
  left,
  right,
  className,
  inputClassName,
  leftClassName,
  rightClassName,
  disabled,
  readOnly,
  type = "text",
  ...props
}: InputWithAffixesProps) => {
  const affixBase = cn(
    "inline-flex items-center px-2 text-sm text-muted-foreground select-none",
    readOnly ? "bg-transparent" : "bg-muted/50 text-muted-foreground",
  );
  const disabledAffix = disabled ? "opacity-60 pointer-events-none" : "";

  return (
    <div
      className={cn(
        "group/input flex h-9 w-full min-w-0 items-stretch rounded-md",
        readOnly
          ? "border-0 bg-transparent shadow-none"
          : cn(
              "border border-input bg-background shadow-xs transition-[box-shadow,border-color]",
              "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
            ),
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      aria-invalid={props["aria-invalid"]}
      aria-readonly={readOnly || undefined}
      data-disabled={disabled ? "" : undefined}
    >
      {left != null && (
        <span
          className={cn(
            affixBase,
            !readOnly && "rounded-l-md border-r border-input",
            "truncate",
            disabledAffix,
            leftClassName,
          )}
        >
          {left}
        </span>
      )}

      <input
        type={type}
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
          "selection:bg-primary selection:text-primary-foreground file:text-foreground placeholder:text-muted-foreground/50",
          "min-w-0 flex-1 bg-transparent px-3 py-1 text-base md:text-sm",
          "border-0 outline-none focus-visible:outline-none",
          left ? "rounded-none rounded-r-md" : right ? "rounded-none rounded-l-md" : "rounded-md",
          "h-full",
          readOnly && "cursor-default",
          inputClassName,
        )}
        {...props}
      />

      {right != null && (
        <span
          className={cn(
            affixBase,
            !readOnly && "rounded-r-md border-l border-input",
            disabledAffix,
            rightClassName,
          )}
        >
          {right}
        </span>
      )}
    </div>
  );
};

export interface InputCopyableProps
  extends
    Omit<ComponentPropsWithRef<"input">, "readOnly">,
    Pick<CopyableButtonProps, "copiedDuration"> {
  inputClassName?: string;
  readOnly?: boolean;
  onCopied?: (text: string) => void;
}

export const InputCopyable = ({
  ref,
  className,
  inputClassName,
  readOnly,
  copiedDuration = 666,
  onCopied,
  onChange,
  ...props
}: InputCopyableProps) => {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const isCopyOnly = props.value !== undefined && onChange === undefined;
  const resolvedReadOnly = readOnly || isCopyOnly;

  useImperativeHandle(ref, () => inputRef.current!, []);
  const copyText = String(props.value ?? props.defaultValue ?? "");

  return (
    <div className={cn("relative w-full", className)}>
      <Input
        ref={inputRef}
        id={props.id ?? id}
        className={cn("pe-9", inputClassName)}
        readOnly={resolvedReadOnly}
        onChange={onChange}
        {...props}
      />
      <CopyableButton text={copyText} onCopied={onCopied} copiedDuration={copiedDuration} />
    </div>
  );
};
