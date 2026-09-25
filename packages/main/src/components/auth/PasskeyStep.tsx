import { useTransition } from "react";
import { Button, TextSeparator } from "@monrep/ui/base";
import { startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";

type PasskeyStepProps = {
  email: string;
  pending: boolean;
  onStart: () => Promise<{ options: PublicKeyCredentialRequestOptionsJSON } | null>;
  onVerified: (response: unknown) => Promise<void>;
  onFallbackPassword: () => void;
};

export function PasskeyStep({
  email,
  pending,
  onStart,
  onVerified,
  onFallbackPassword,
}: PasskeyStepProps) {
  const [localPending, startLocalPending] = useTransition();
  const handlePasskeyAuthenticate = () => {
    startLocalPending(async () => {
      const started = await onStart();
      if (!started) return;
      const assertion = await startAuthentication({ optionsJSON: started.options });
      await onVerified(assertion);
    });
  };

  const disabled = pending || localPending;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm text-muted-foreground">Sign in as {email}</p>
      <Button
        type="button"
        disabled={disabled}
        className="w-full"
        onClick={handlePasskeyAuthenticate}
      >
        {disabled ? "Waiting for passkey…" : "Continue with passkey"}
      </Button>
      <TextSeparator text="Or" />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className="w-full"
        onClick={onFallbackPassword}
      >
        Use password instead
      </Button>
    </div>
  );
}
