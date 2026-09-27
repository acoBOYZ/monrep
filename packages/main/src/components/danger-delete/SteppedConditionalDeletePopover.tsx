import { isValidElement, memo, useCallback, useId, useState } from "react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, Dialog, DialogContent, DialogTrigger } from "@monrep/ui/base";
import { cn } from "@monrep/utils";
import { SteppedDeleteDialogContent } from "./SteppedDeleteDialogContent";
import { useSteppedDeleteDialogState } from "./useSteppedDeleteDialogState";
import type { ReactNode, SyntheticEvent } from "react";
import type { ConsequenceItem } from "./ConsequenceTimeline";
import type { RequireMatchRule } from "./match";

const stopEvent = (event: SyntheticEvent) => {
  event.stopPropagation();
};

type SteppedConditionalDeletePopoverProps = {
  id: string;
  trigger?: ReactNode;
  onDelete?: (id: string) => void | Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: ReactNode;
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

export const SteppedConditionalDeletePopover = memo(
  ({
    id,
    trigger,
    onDelete,
    open: openProp,
    onOpenChange,
    title,
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
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const [internalLoading, setInternalLoading] = useState(false);

    const isControlled = openProp !== undefined;
    const open = isControlled ? openProp : uncontrolledOpen;
    const isExternalLoading = externalLoading ?? false;
    const blockingLoading = internalLoading || isExternalLoading;

    const { step, goToStep, matchValue, setMatchValue, reset, canConfirmFinal } =
      useSteppedDeleteDialogState({
        requireMatch,
        blockingLoading,
      });

    const setOpen = useCallback(
      (next: boolean) => {
        if (!next) {
          reset();
          setInternalLoading((prev) => (prev ? false : prev));
        }
        if (!isControlled) {
          setUncontrolledOpen(next);
        }
        onOpenChange?.(next);
      },
      [isControlled, onOpenChange, reset],
    );

    const triggerElement = isValidElement(trigger) ? (
      trigger
    ) : trigger !== undefined && trigger !== null ? (
      <span>{trigger}</span>
    ) : (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 rounded-md border border-transparent text-cool transition-colors hover:border-border hover:text-foreground"
        aria-label="Delete"
      >
        <HugeiconsIcon icon={Delete02Icon} className="size-4" />
      </Button>
    );

    const inputId = useId();
    const resolvedHeaderTitle = title ?? "Are you sure?";

    const handleCancel = useCallback(() => {
      setOpen(false);
    }, [setOpen]);

    const handleDelete = useCallback(() => {
      if (!canConfirmFinal) return;
      setInternalLoading(true);

      void Promise.resolve(onDelete?.(id))
        .then(() => {
          setOpen(false);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setInternalLoading(false);
        });
    }, [canConfirmFinal, id, onDelete, setOpen]);

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
          aria-label={
            typeof resolvedHeaderTitle === "string" ? resolvedHeaderTitle : "Are you sure?"
          }
          onPointerDown={stopEvent}
          onClick={stopEvent}
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
  },
);

SteppedConditionalDeletePopover.displayName = "SteppedConditionalDeletePopover";
