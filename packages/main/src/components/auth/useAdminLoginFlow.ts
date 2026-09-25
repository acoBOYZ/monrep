import { useCallback, useEffect, useState } from "react";
import { toast } from "@monrep/ui/base";
import { browserSupportsPasskeys, platformAuthenticatorIsAvailable } from "@simplewebauthn/browser";
import { withAuthPending } from "./withAuthPending";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import type { PendingStep } from "@/server/auth/pending/types";
import {
  getPublicAuthConfig,
  loginPasswordFn,
  passkeyLoginOptionsFn,
  passkeyLoginVerifyFn,
  passkeyRegisterOptionsFn,
  passkeyRegisterVerifyFn,
  passkeyStatusFn,
  totpEnrollConfirmFn,
  totpEnrollStartFn,
  totpVerifyFn,
} from "@/server/auth/functions";
import { authErrorMessage } from "@/server/auth/schemas";

export type LoginStep =
  | "loading"
  | "passkey"
  | "password"
  | "totp"
  | "enroll_totp"
  | "enroll_passkey"
  | "done";

const platformPasskeyOk = async (): Promise<boolean> => {
  try {
    const [passkeys, platform] = await Promise.all([
      browserSupportsPasskeys(),
      platformAuthenticatorIsAvailable(),
    ]);
    return passkeys && platform;
  } catch {
    return false;
  }
};

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

  useEffect(() => {
    void (async () => {
      const config = await getPublicAuthConfig();
      setTurnstileSiteKey(config.turnstileSiteKey);
      setEmail(config.adminEmailHint);
      const platform = await platformPasskeyOk();
      if (!platform) {
        setStep("password");
        return;
      }
      const status = await passkeyStatusFn({ data: { email: config.adminEmailHint } });
      const registered = status.ok && status.hasPasskeys;
      setHasPasskeys(registered);
      if (registered) {
        setStep("passkey");
      } else {
        setStep("password");
      }
    })();
  }, []);

  const goAfterPending = useCallback(async (next: PendingStep) => {
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
  }, []);

  const finishSession = useCallback(async () => {
    if (hasPasskeys) {
      setStep("done");
      await onAuthed();
      return;
    }
    setStep("enroll_passkey");
  }, [hasPasskeys, onAuthed]);

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
  }, [email]);

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
    [email, finishSession, goAfterPending],
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
  }, [finishSession, totpCode]);

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
  }, [finishSession, totpCode]);

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
  }, []);

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
    [onAuthed],
  );

  const skipPasskeyEnroll = useCallback(async () => {
    setStep("done");
    await onAuthed();
  }, [onAuthed]);

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
