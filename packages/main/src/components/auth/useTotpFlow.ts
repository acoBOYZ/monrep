import { useCallback } from "react";
import { toast } from "@monrep/ui/base";
import { withAuthPending } from "./withAuthPending";
import type { LoginStep } from "./useAdminLoginFlow";
import type { PendingStep } from "@/server/auth/pending/types";
import { totpEnrollConfirmFn, totpEnrollStartFn, totpVerifyFn } from "@/server/auth/functions";
import { authErrorMessage } from "@/server/auth/schemas";

type TotpFlowDeps = {
  setPending: (value: boolean) => void;
  setTotpCode: (value: string) => void;
  setStep: (step: LoginStep) => void;
  setOtpauth: (value: string) => void;
  setTotpSecret: (value: string) => void;
  totpCode: string;
  finishSession: () => Promise<void>;
};

export function useTotpFlow({
  setPending,
  setTotpCode,
  setStep,
  setOtpauth,
  setTotpSecret,
  totpCode,
  finishSession,
}: TotpFlowDeps) {
  const goAfterPending = useCallback(
    async (next: PendingStep) => {
      setTotpCode("");
      if (next !== "enroll_totp") {
        setStep("totp");
        return;
      }
      const run = await withAuthPending(
        setPending,
        async () => totpEnrollStartFn(),
        "TOTP setup failed",
      );
      if (!run.ok) return;
      if (!run.value.ok) {
        toast.error(authErrorMessage(run.value.error));
        setStep("password");
        return;
      }
      setOtpauth(run.value.otpauth);
      setTotpSecret(run.value.secret);
      setStep("enroll_totp");
    },
    [setOtpauth, setPending, setStep, setTotpCode, setTotpSecret],
  );

  const confirmTotpEnroll = useCallback(async () => {
    const run = await withAuthPending(
      setPending,
      async () => totpEnrollConfirmFn({ data: { code: totpCode } }),
      "TOTP failed",
    );
    if (!run.ok) return;
    if (!run.value.ok) {
      toast.error(authErrorMessage(run.value.error));
      return;
    }
    await finishSession();
  }, [finishSession, setPending, totpCode]);

  const verifyTotp = useCallback(async () => {
    const run = await withAuthPending(
      setPending,
      async () => totpVerifyFn({ data: { code: totpCode } }),
      "TOTP failed",
    );
    if (!run.ok) return;
    if (!run.value.ok) {
      toast.error(authErrorMessage(run.value.error));
      return;
    }
    await finishSession();
  }, [finishSession, setPending, totpCode]);

  return { goAfterPending, confirmTotpEnroll, verifyTotp };
}
