import { PasskeyEnrollStep } from "./PasskeyEnrollStep";
import { PasskeyStep } from "./PasskeyStep";
import { PasswordStep } from "./PasswordStep";
import { TotpEnrollStep } from "./TotpEnrollStep";
import { TotpVerifyStep } from "./TotpVerifyStep";
import type { useAdminLoginFlow } from "./useAdminLoginFlow";

type AdminLoginStepsProps = {
  flow: ReturnType<typeof useAdminLoginFlow>;
};

export function AdminLoginSteps({ flow }: AdminLoginStepsProps) {
  return (
    <div className="flex flex-col gap-4">
      {flow.step === "passkey" ? (
        <PasskeyStep
          email={flow.email}
          pending={flow.pending}
          onStart={flow.startPasskeyLogin}
          onVerified={flow.verifyPasskeyLogin}
          onFallbackPassword={() => flow.setStep("password")}
        />
      ) : null}

      {flow.step === "password" && flow.turnstileSiteKey ? (
        <PasswordStep
          email={flow.email}
          password={flow.password}
          turnstileSiteKey={flow.turnstileSiteKey}
          turnstileToken={flow.turnstileToken}
          pending={flow.pending}
          onEmailChange={flow.setEmail}
          onPasswordChange={flow.setPassword}
          onTurnstileToken={flow.setTurnstileToken}
          onSubmit={() => void flow.submitPassword()}
          onUsePasskey={flow.canUsePasskey ? () => flow.setStep("passkey") : undefined}
        />
      ) : null}

      {flow.step === "enroll_totp" ? (
        <TotpEnrollStep
          otpauth={flow.otpauth}
          secret={flow.totpSecret}
          code={flow.totpCode}
          pending={flow.pending}
          onCodeChange={flow.setTotpCode}
          onConfirm={() => void flow.confirmTotpEnroll()}
        />
      ) : null}

      {flow.step === "totp" ? (
        <TotpVerifyStep
          code={flow.totpCode}
          pending={flow.pending}
          onCodeChange={flow.setTotpCode}
          onVerify={() => void flow.verifyTotp()}
        />
      ) : null}

      {flow.step === "enroll_passkey" ? (
        <PasskeyEnrollStep
          pending={flow.pending}
          onStart={flow.startPasskeyRegister}
          onVerified={flow.verifyPasskeyRegister}
          onSkip={() => void flow.skipPasskeyEnroll()}
        />
      ) : null}
    </div>
  );
}
