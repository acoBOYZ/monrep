import { Alert01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DialogTitle } from "@monrep/ui/base";
import { ConsequenceTimeline } from "./ConsequenceTimeline";
import { DeleteEntityHero } from "./DeleteEntityHero";
import { DeleteStepFooter } from "./DeleteStepFooter";
import { MatchConfirmField } from "./MatchConfirmField";
import type { ReactNode } from "react";
import type { ConsequenceItem } from "./ConsequenceTimeline";
import type { RequireMatchRule } from "./match";
import type { DeleteDialogStep } from "./useSteppedDeleteDialogState";

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
        <MatchConfirmField
          inputId={inputId}
          matchValue={matchValue}
          setMatchValue={setMatchValue}
          requireMatch={requireMatch}
          inputLabel={inputLabel}
          placeholder={placeholder}
          onDelete={onDelete}
        />
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
          <DeleteStepFooter
            step={step}
            resolvedCancel={resolvedCancel}
            step1ContinueLabel={step1ContinueLabel}
            step2AcknowledgeLabel={step2AcknowledgeLabel}
            resolvedConfirm={resolvedConfirm}
            loading={loading}
            canConfirmFinal={canConfirmFinal}
            onCancel={onCancel}
            onDelete={onDelete}
            onStep1Continue={onStep1Continue}
            onStep2Continue={onStep2Continue}
          />
        </div>
      </div>
    </div>
  );
}
