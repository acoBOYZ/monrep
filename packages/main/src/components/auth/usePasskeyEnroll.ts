import { useCallback } from "react";
import { toast } from "@monrep/ui/base";
import { withAuthPending } from "./withAuthPending";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import type { LoginStep } from "./useAdminLoginFlow";
import { passkeyRegisterOptionsFn, passkeyRegisterVerifyFn } from "@/server/auth/functions";
import { authErrorMessage } from "@/server/auth/schemas";

type PasskeyEnrollDeps = {
  setPending: (value: boolean) => void;
  setHasPasskeys: (value: boolean) => void;
  setStep: (step: LoginStep) => void;
  onAuthed: () => void | Promise<void>;
};

export function usePasskeyEnroll({
  setPending,
  setHasPasskeys,
  setStep,
  onAuthed,
}: PasskeyEnrollDeps) {
  const startPasskeyRegister = useCallback(async (): Promise<{
    options: PublicKeyCredentialCreationOptionsJSON;
  } | null> => {
    const run = await withAuthPending(
      setPending,
      async () => passkeyRegisterOptionsFn(),
      "Passkey register failed",
    );
    if (!run.ok) return null;
    return {
      options: JSON.parse(run.value.optionsJson) as PublicKeyCredentialCreationOptionsJSON,
    };
  }, [setPending]);

  const verifyPasskeyRegister = useCallback(
    async (response: unknown) => {
      const run = await withAuthPending(
        setPending,
        async () => passkeyRegisterVerifyFn({ data: { response } }),
        "Passkey register failed",
      );
      if (!run.ok) return;
      if (!run.value.ok) {
        toast.error(authErrorMessage(run.value.error));
        return;
      }
      setHasPasskeys(true);
      setStep("done");
      await onAuthed();
    },
    [onAuthed, setHasPasskeys, setPending, setStep],
  );

  const skipPasskeyEnroll = useCallback(async () => {
    setStep("done");
    await onAuthed();
  }, [onAuthed, setStep]);

  return { startPasskeyRegister, verifyPasskeyRegister, skipPasskeyEnroll };
}
