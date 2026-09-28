import { useCallback } from "react";
import { toast } from "@monrep/ui/base";
import { withAuthPending } from "./withAuthPending";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import type { LoginStep } from "./useAdminLoginFlow";
import type { PendingStep } from "@/server/auth/pending/types";
import { passkeyLoginOptionsFn, passkeyLoginVerifyFn } from "@/server/auth/functions";
import { authErrorMessage } from "@/server/auth/schemas";

type PasskeyLoginDeps = {
  email: string;
  setPending: (value: boolean) => void;
  setStep: (step: LoginStep) => void;
  finishSession: () => Promise<void>;
  goAfterPending: (next: PendingStep) => Promise<void>;
};

export function usePasskeyLogin({
  email,
  setPending,
  setStep,
  finishSession,
  goAfterPending,
}: PasskeyLoginDeps) {
  const startPasskeyLogin = useCallback(async (): Promise<{
    options: PublicKeyCredentialRequestOptionsJSON;
  } | null> => {
    const run = await withAuthPending(
      setPending,
      async () => passkeyLoginOptionsFn({ data: { email } }),
      "Passkey failed",
    );
    if (!run.ok) return null;
    if (!run.value.ok) {
      toast.error(authErrorMessage(run.value.error));
      setStep("password");
      return null;
    }
    return {
      options: JSON.parse(run.value.optionsJson) as PublicKeyCredentialRequestOptionsJSON,
    };
  }, [email, setPending, setStep]);

  const verifyPasskeyLogin = useCallback(
    async (response: unknown) => {
      const run = await withAuthPending(
        setPending,
        async () => passkeyLoginVerifyFn({ data: { email, response } }),
        "Passkey failed",
      );
      if (!run.ok) return;
      if (!run.value.ok) {
        toast.error(authErrorMessage(run.value.error));
        return;
      }
      if ("session" in run.value) {
        await finishSession();
        return;
      }
      if ("step" in run.value) {
        await goAfterPending(run.value.step);
      }
    },
    [email, finishSession, goAfterPending, setPending],
  );

  return { startPasskeyLogin, verifyPasskeyLogin };
}
