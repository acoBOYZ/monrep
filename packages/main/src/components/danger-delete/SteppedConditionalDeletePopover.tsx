import { isValidElement, useId } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@monrep/ui/base";
import { cn } from "@monrep/utils";
import { DeleteTriggerButton } from "./DeleteTriggerButton";
import { SteppedDeleteDialogContent } from "./SteppedDeleteDialogContent";
import { stopSteppedDeleteEvent } from "./steppedDelete.helpers";
import { useSteppedConditionalDeletePopover } from "./useSteppedConditionalDeletePopover";
import type { ReactNode } from "react";
import type { ConsequenceItem } from "./ConsequenceTimeline";
import type { RequireMatchRule } from "./match";

type SteppedConditionalDeletePopoverProps = {
  id: string;
  trigger?: ReactNode;
  onDelete?: (id: string) => void | Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  headerTitle?: ReactNode;
  displayName: string;
  metadata?: ReactNode;
  consequences: Array<ConsequenceItem>;
  warningText?: ReactNode;
  requireMatch?: RequireMatchRule;
  inputLabel?: ReactNode;
  placeholder?: string;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  step1ContinueLabel?: ReactNode;
  step2AcknowledgeLabel?: ReactNode;
  loading?: boolean;
  contentClassName?: string;
};

export const SteppedConditionalDeletePopover = ({
  id,
  trigger,
  onDelete,
  open: openProp,
  onOpenChange,
  headerTitle,
  displayName,
  metadata,
  consequences,
  warningText,
  requireMatch,
  inputLabel,
  placeholder,
  confirmLabel,
  cancelLabel,
  step1ContinueLabel = "Continue",
  step2AcknowledgeLabel = "I understand the consequences",
  loading: externalLoading,
  contentClassName,
}: SteppedConditionalDeletePopoverProps) => {
  const {
    open,
    setOpen,
    step,
    goToStep,
    matchValue,
    setMatchValue,
    canConfirmFinal,
    blockingLoading,
    handleCancel,
    handleDelete,
  } = useSteppedConditionalDeletePopover({
    id,
    openProp,
    onOpenChange,
    requireMatch,
    externalLoading: externalLoading ?? false,
    onDelete,
  });

  const inputId = useId();
  const resolvedHeaderTitle = headerTitle ?? "Are you sure?";
  const triggerElement = isValidElement(trigger) ? (
    trigger
  ) : trigger !== undefined && trigger !== null ? (
    <span>{trigger}</span>
  ) : (
    <DeleteTriggerButton headerTitle={headerTitle} />
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        if (!nextOpen && eventDetails.reason === "outside-press") {
          return;
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger render={triggerElement} />
      <DialogContent
        className={cn(
          "flex! max-h-[min(36rem,min(85dvh,calc(100dvh-2rem)))] min-h-0 w-[min(26rem,calc(100vw-1.5rem))] max-w-lg flex-col gap-0! overflow-hidden border-border/80 p-0",
          contentClassName,
        )}
        aria-label={typeof resolvedHeaderTitle === "string" ? resolvedHeaderTitle : "Are you sure?"}
        onPointerDown={stopSteppedDeleteEvent}
        onClick={stopSteppedDeleteEvent}
      >
        <SteppedDeleteDialogContent
          key={step}
          step={step}
          headerTitle={resolvedHeaderTitle}
          displayName={displayName}
          metadata={metadata}
          warningText={warningText}
          consequences={consequences}
          inputId={inputId}
          matchValue={matchValue}
          setMatchValue={setMatchValue}
          requireMatch={requireMatch}
          inputLabel={inputLabel}
          placeholder={placeholder}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          step1ContinueLabel={step1ContinueLabel}
          step2AcknowledgeLabel={step2AcknowledgeLabel}
          loading={blockingLoading}
          canConfirmFinal={canConfirmFinal}
          onCancel={handleCancel}
          onDelete={handleDelete}
          onStep1Continue={() => {
            goToStep(2);
          }}
          onStep2Continue={() => {
            goToStep(3);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
