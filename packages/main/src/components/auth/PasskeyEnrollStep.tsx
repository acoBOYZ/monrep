import { useTransition } from "react";
import { Button, TextSeparator } from "@monrep/ui/base";
import { startRegistration } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";

type PasskeyEnrollStepProps = {
  pending: boolean;
  onStart: () => Promise<{ options: PublicKeyCredentialCreationOptionsJSON } | null>;
  onVerified: (response: unknown) => Promise<void>;
  onSkip: () => void;
};

export function PasskeyEnrollStep({
  pending,
  onStart,
  onVerified,
  onSkip,
}: PasskeyEnrollStepProps) {
  const [localPending, startLocalPending] = useTransition();
  const handlePasskeyRegister = () => {
    startLocalPending(async () => {
      const started = await onStart();
      if (!started) return;
      const attestation = await startRegistration({ optionsJSON: started.options });
      await onVerified(attestation);
    });
  };
  const disabled = pending || localPending;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm text-muted-foreground">
        Add a passkey for faster sign-in next time.
      </p>
      <Button type="button" disabled={disabled} className="w-full" onClick={handlePasskeyRegister}>
        {disabled ? "Waiting…" : "Register passkey"}
      </Button>
      <TextSeparator text="Or" />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className="w-full"
        onClick={onSkip}
      >
        Skip for now
      </Button>
    </div>
  );
}
