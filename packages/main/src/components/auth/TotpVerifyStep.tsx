import { Button } from "@monrep/ui/base";
import { TotpCodeInput } from "./TotpCodeInput";
import type { SubmitEvent } from "react";

type TotpVerifyStepProps = {
  code: string;
  pending: boolean;
  onCodeChange: (value: string) => void;
  onVerify: () => void;
};

export function TotpVerifyStep({ code, pending, onCodeChange, onVerify }: TotpVerifyStepProps) {
  const handleTotpVerifySubmit = (event: SubmitEvent) => {
    event.preventDefault();
    onVerify();
  };

  return (
    <form onSubmit={handleTotpVerifySubmit} className="flex flex-col gap-5">
      <p className="text-center text-sm text-muted-foreground">
        Enter the 6-digit code from your authenticator app.
      </p>
      <TotpCodeInput code={code} onCodeChange={onCodeChange} />
      <Button type="submit" disabled={pending || code.length < 6} className="w-full">
        {pending ? "Verifying…" : "Verify"}
      </Button>
    </form>
  );
}
