import { Alert01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, DialogTitle, Input, Label } from "@monrep/ui/base";
import { cn } from "@monrep/utils";
import { ConsequenceTimeline } from "./ConsequenceTimeline";
import { DeleteEntityHero } from "./DeleteEntityHero";
import type { ReactNode, SyntheticEvent } from "react";
import type { ConsequenceItem } from "./ConsequenceTimeline";
import type { RequireMatchRule } from "./match";
import type { DeleteDialogStep } from "./useSteppedDeleteDialogState";

const stopEvent = (event: SyntheticEvent) => {
  event.stopPropagation();
};

type SteppedDeleteDialogContentProps = {
  step: DeleteDialogStep;
  headerTitle: ReactNode;
  displayName: string;
  metadata?: ReactNode;
  warningText?: ReactNode;
  consequences: Array<ConsequenceItem>;
  inputId: string;
  matchValue: string;
  setMatchValue: (value: string) => void;
  requireMatch?: RequireMatchRule;
  inputLabel?: ReactNode;
  placeholder?: string;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  step1ContinueLabel: ReactNode;
  step2AcknowledgeLabel: ReactNode;
  loading: boolean;
  canConfirmFinal: boolean;
  onCancel: () => void;
  onDelete: () => void;
  onStep1Continue: () => void;
  onStep2Continue: () => void;
};

export function SteppedDeleteDialogContent({
  step,
  headerTitle,
  displayName,
  metadata,
  warningText,
  consequences,
  inputId,
  matchValue,
  setMatchValue,
  requireMatch,
  inputLabel,
  placeholder,
  confirmLabel,
  cancelLabel,
  step1ContinueLabel,
  step2AcknowledgeLabel,
  loading,
  canConfirmFinal,
  onCancel,
  onDelete,
  onStep1Continue,
  onStep2Continue,
}: SteppedDeleteDialogContentProps) {
  const resolvedWarning = warningText ?? "This action cannot be undone.";
  const resolvedConfirm = confirmLabel ?? "Delete";
  const resolvedCancel = cancelLabel ?? "Cancel";

  const body = (() => {
    if (step === 1) {
      return <DeleteEntityHero displayName={displayName} metadata={metadata} compact={false} />;
    }
    if (step === 2) {
      return (
        <div className="space-y-5">
          <DeleteEntityHero displayName={displayName} metadata={metadata} compact />
          <div className="flex gap-3 rounded-lg border border-warning/45 bg-warning/10 px-3 py-2.5">
            <HugeiconsIcon
              icon={Alert01Icon}
              className="mt-0.5 size-5 shrink-0 text-warning"
              aria-hidden
            />
            <p className="text-sm leading-snug font-medium text-foreground">{resolvedWarning}</p>
          </div>
          <ConsequenceTimeline items={consequences} />
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <DeleteEntityHero displayName={displayName} metadata={metadata} compact />
        {requireMatch !== undefined ? (
          <>
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
          </>
        ) : null}
      </div>
    );
  })();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-4 py-3 pr-14">
        <DialogTitle className="text-left text-base leading-snug font-semibold">
          {headerTitle}
        </DialogTitle>
      </div>

      <div className="isolate flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className="min-h-0 flex-1 scrollbar-none overflow-x-clip overflow-y-auto overscroll-contain p-4 [&::-webkit-scrollbar]:hidden"
          aria-live="polite"
        >
          {body}
        </div>

        <div className="shrink-0 border-t border-border bg-background px-4 py-3">
          {step === 1 ? (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-10 w-full font-semibold"
                onClick={(e) => {
                  stopEvent(e);
                  onStep1Continue();
                }}
              >
                {step1ContinueLabel}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-9 w-full text-cool"
                onClick={(e) => {
                  stopEvent(e);
                  onCancel();
                }}
              >
                {resolvedCancel}
              </Button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-10 w-full font-semibold"
                onClick={(e) => {
                  stopEvent(e);
                  onStep2Continue();
                }}
              >
                {step2AcknowledgeLabel}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-9 w-full text-cool"
                onClick={(e) => {
                  stopEvent(e);
                  onCancel();
                }}
              >
                {resolvedCancel}
              </Button>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="destructive"
                className="h-10 w-full"
                onClick={(e) => {
                  stopEvent(e);
                  onDelete();
                }}
                disabled={!canConfirmFinal}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    {resolvedConfirm}
                    <span aria-hidden>…</span>
                  </span>
                ) : (
                  resolvedConfirm
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full"
                onClick={(e) => {
                  stopEvent(e);
                  onCancel();
                }}
                disabled={loading}
              >
                {resolvedCancel}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
