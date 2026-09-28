import { useCallback, useState } from "react";
import { useSteppedDeleteDialogState } from "./useSteppedDeleteDialogState";
import type { RequireMatchRule } from "./match";

type UseSteppedConditionalDeletePopoverOptions = {
  id: string;
  openProp?: boolean;
  onOpenChange?: (open: boolean) => void;
  requireMatch?: RequireMatchRule;
  externalLoading: boolean;
  onDelete?: (id: string) => void | Promise<void>;
};

export function useSteppedConditionalDeletePopover({
  id,
  openProp,
  onOpenChange,
  requireMatch,
  externalLoading,
  onDelete,
}: UseSteppedConditionalDeletePopoverOptions) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);

  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;
  const blockingLoading = internalLoading || externalLoading;

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

  return {
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
  };
}
