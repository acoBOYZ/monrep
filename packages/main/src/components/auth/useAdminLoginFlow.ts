import { useCallback, useState } from "react";
import { toast } from "@monrep/ui/base";
import { useAdminLoginBootstrap } from "./useAdminLoginBootstrap";
import { usePasskeyEnroll } from "./usePasskeyEnroll";
import { usePasskeyLogin } from "./usePasskeyLogin";
import { useTotpFlow } from "./useTotpFlow";
import { withAuthPending } from "./withAuthPending";
import { loginPasswordFn } from "@/server/auth/functions";
import { authErrorMessage } from "@/server/auth/schemas";

export type LoginStep =
  | "loading"
  | "passkey"
  | "password"
  | "totp"
  | "enroll_totp"
  | "enroll_passkey"
  | "done";

export function useAdminLoginFlow(onAuthed: () => void | Promise<void>) {
  const [step, setStep] = useState<LoginStep>("loading");
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileSiteKey, setTurnstileSiteKey] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [otpauth, setOtpauth] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [hasPasskeys, setHasPasskeys] = useState(false);
  const [platformOk, setPlatformOk] = useState(false);

  useAdminLoginBootstrap({
    setTurnstileSiteKey,
    setEmail,
    setPlatformOk,
    setHasPasskeys,
    setStep,
  });

  const finishSession = useCallback(async () => {
    if (hasPasskeys) {
      setStep("done");
      await onAuthed();
      return;
    }
    setStep("enroll_passkey");
  }, [hasPasskeys, onAuthed]);

  const { goAfterPending, confirmTotpEnroll, verifyTotp } = useTotpFlow({
    setPending,
    setTotpCode,
    setStep,
    setOtpauth,
    setTotpSecret,
    totpCode,
    finishSession,
  });

  const { startPasskeyLogin, verifyPasskeyLogin } = usePasskeyLogin({
    email,
    setPending,
    setStep,
    finishSession,
    goAfterPending,
  });

  const { startPasskeyRegister, verifyPasskeyRegister, skipPasskeyEnroll } = usePasskeyEnroll({
    setPending,
    setHasPasskeys,
    setStep,
    onAuthed,
  });

  const submitPassword = useCallback(async () => {
    if (pending) return;
    const run = await withAuthPending(
      setPending,
      async () => loginPasswordFn({ data: { email, password, turnstileToken } }),
      "Login failed",
    );
    if (!run.ok) return;
    if (!run.value.ok) {
      toast.error(authErrorMessage(run.value.error));
      setTurnstileToken("");
      return;
    }
    await goAfterPending(run.value.step);
  }, [email, goAfterPending, password, pending, turnstileToken]);

  return {
    step,
    pending,
    email,
    setEmail,
    password,
    setPassword,
    turnstileSiteKey,
    turnstileToken,
    setTurnstileToken,
    totpCode,
    setTotpCode,
    otpauth,
    totpSecret,
    canUsePasskey: platformOk && hasPasskeys,
    setStep,
    submitPassword,
    startPasskeyLogin,
    verifyPasskeyLogin,
    confirmTotpEnroll,
    verifyTotp,
    startPasskeyRegister,
    verifyPasskeyRegister,
    skipPasskeyEnroll,
  };
}
