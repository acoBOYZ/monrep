import { useCallback, useState } from "react";
import { matchesRule } from "./match";
import type { RequireMatchRule } from "./match";

export type DeleteDialogStep = 1 | 2 | 3;

export function useSteppedDeleteDialogState(options: {
  requireMatch?: RequireMatchRule;
  blockingLoading: boolean;
}) {
  const [step, setStep] = useState<DeleteDialogStep>(1);
  const [matchValue, setMatchValue] = useState("");

  const reset = useCallback(() => {
    setStep(1);
    setMatchValue("");
  }, []);

  const goToStep = useCallback((next: DeleteDialogStep) => {
    setStep(next);
  }, []);

  const canConfirmFinal =
    step === 3 && matchesRule(matchValue, options.requireMatch) && !options.blockingLoading;

  return {
    step,
    goToStep,
    matchValue,
    setMatchValue,
    reset,
    canConfirmFinal,
  };
}
