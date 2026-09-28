import { useEffect } from "react";
import { browserSupportsPasskeys, platformAuthenticatorIsAvailable } from "@simplewebauthn/browser";
import type { LoginStep } from "./useAdminLoginFlow";
import { getPublicAuthConfig, passkeyStatusFn } from "@/server/auth/functions";

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

type BootstrapSetters = {
  setTurnstileSiteKey: (value: string) => void;
  setEmail: (value: string) => void;
  setPlatformOk: (value: boolean) => void;
  setHasPasskeys: (value: boolean) => void;
  setStep: (step: LoginStep) => void;
};

export function useAdminLoginBootstrap({
  setTurnstileSiteKey,
  setEmail,
  setPlatformOk,
  setHasPasskeys,
  setStep,
}: BootstrapSetters) {
  useEffect(() => {
    void (async () => {
      const config = await getPublicAuthConfig();
      setTurnstileSiteKey(config.turnstileSiteKey);
      setEmail(config.adminEmailHint);
      const platform = await platformPasskeyOk();
      setPlatformOk(platform);
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
  }, [setEmail, setHasPasskeys, setPlatformOk, setStep, setTurnstileSiteKey]);
}
