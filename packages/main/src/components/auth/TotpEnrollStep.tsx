import { Button, CopyableButton } from "@monrep/ui/base";
import { TotpCodeInput } from "./TotpCodeInput";
import { TotpQr } from "./TotpQr";
import type { SubmitEvent } from "react";

type TotpEnrollStepProps = {
  otpauth: string;
  secret: string;
  code: string;
  pending: boolean;
  onCodeChange: (value: string) => void;
  onConfirm: () => void;
};

export function TotpEnrollStep({
  otpauth,
  secret,
  code,
  pending,
  onCodeChange,
  onConfirm,
}: TotpEnrollStepProps) {
  const handleTotpEnrollSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    onConfirm();
  };

  return (
    <form onSubmit={handleTotpEnrollSubmit} className="flex flex-col items-center gap-5">
      <p className="text-center text-sm text-muted-foreground">
        Scan with your authenticator app, then enter the code.
      </p>
      <TotpQr otpauth={otpauth} />
      <CopyableButton variant="inline" text={secret} className="font-mono text-xs break-all" />
      <TotpCodeInput code={code} onCodeChange={onCodeChange} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Confirming…" : "Confirm and continue"}
      </Button>
    </form>
  );
}
