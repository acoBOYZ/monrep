import { Button, Input } from "@monrep/ui/base";
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
      <p className="text-center font-mono text-xs break-all text-muted-foreground">{secret}</p>
      <label className="flex w-full flex-col gap-1.5 text-sm font-medium">
        Authenticator code
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
          placeholder="123456"
        />
      </label>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Confirming…" : "Confirm and continue"}
      </Button>
    </form>
  );
}
