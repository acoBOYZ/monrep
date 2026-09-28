import { Button } from "@monrep/ui/base";
import { stopSteppedDeleteEvent } from "./steppedDelete.helpers";
import type { ReactNode } from "react";
import type { DeleteDialogStep } from "./useSteppedDeleteDialogState";

type DeleteStepFooterProps = {
  step: DeleteDialogStep;
  resolvedCancel: ReactNode;
  step1ContinueLabel: ReactNode;
  step2AcknowledgeLabel: ReactNode;
  resolvedConfirm: ReactNode;
  loading: boolean;
  canConfirmFinal: boolean;
  onCancel: () => void;
  onDelete: () => void;
  onStep1Continue: () => void;
  onStep2Continue: () => void;
};

export function DeleteStepFooter({
  step,
  resolvedCancel,
  step1ContinueLabel,
  step2AcknowledgeLabel,
  resolvedConfirm,
  loading,
  canConfirmFinal,
  onCancel,
  onDelete,
  onStep1Continue,
  onStep2Continue,
}: DeleteStepFooterProps) {
  if (step === 1) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          className="h-10 w-full font-semibold"
          onClick={(event) => {
            stopSteppedDeleteEvent(event);
            onStep1Continue();
          }}
        >
          {step1ContinueLabel}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-full text-muted-foreground"
          onClick={(event) => {
            stopSteppedDeleteEvent(event);
            onCancel();
          }}
        >
          {resolvedCancel}
        </Button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          className="h-10 w-full font-semibold"
          onClick={(event) => {
            stopSteppedDeleteEvent(event);
            onStep2Continue();
          }}
        >
          {step2AcknowledgeLabel}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-full text-muted-foreground"
          onClick={(event) => {
            stopSteppedDeleteEvent(event);
            onCancel();
          }}
        >
          {resolvedCancel}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="destructive"
        className="h-10 w-full"
        onClick={(event) => {
          stopSteppedDeleteEvent(event);
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
        onClick={(event) => {
          stopSteppedDeleteEvent(event);
          onCancel();
        }}
        disabled={loading}
      >
        {resolvedCancel}
      </Button>
    </div>
  );
}
