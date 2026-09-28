import { Input, Label } from "@monrep/ui/base";
import { cn } from "@monrep/utils";
import type { ReactNode } from "react";
import type { RequireMatchRule } from "./match";

type MatchConfirmFieldProps = {
  inputId: string;
  matchValue: string;
  setMatchValue: (value: string) => void;
  requireMatch?: RequireMatchRule;
  inputLabel?: ReactNode;
  placeholder?: string;
  onDelete: () => void;
};

export function MatchConfirmField({
  inputId,
  matchValue,
  setMatchValue,
  requireMatch,
  inputLabel,
  placeholder,
  onDelete,
}: MatchConfirmFieldProps) {
  if (requireMatch === undefined) return null;

  return (
    <div className="space-y-2">
      {inputLabel ? (
        <Label htmlFor={inputId} className="text-sm font-semibold text-foreground">
          {inputLabel}
        </Label>
      ) : null}
      <Input
        id={inputId}
        type="text"
        value={matchValue}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(event) => {
          setMatchValue(event.target.value);
        }}
        className={cn(
          "h-10 border-destructive/55 bg-background",
          "focus-visible:border-destructive focus-visible:ring-2 focus-visible:ring-destructive/25",
        )}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          onDelete();
        }}
      />
    </div>
  );
}
