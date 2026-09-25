import { Button, InputOTP, InputOTPGroup, InputOTPSlot } from "@monrep/ui/base";
import type { SubmitEvent } from "react";

type TotpVerifyStepProps = {
  code: string;
  pending: boolean;
  onCodeChange: (value: string) => void;
  onVerify: () => void;
};

export function TotpVerifyStep({ code, pending, onCodeChange, onVerify }: TotpVerifyStepProps) {
  const handleCodeChange = (value: string) => {
    onCodeChange(value.replace(/\D/g, "").slice(0, 6));
  };

  const handleTotpVerifySubmit = (event: SubmitEvent) => {
    event.preventDefault();
    onVerify();
  };

  return (
    <form onSubmit={handleTotpVerifySubmit} className="flex flex-col gap-5">
      <p className="text-center text-sm text-muted-foreground">
        Enter the 6-digit code from your authenticator app.
      </p>
      <InputOTP
        maxLength={6}
        value={code}
        onChange={handleCodeChange}
        containerClassName="justify-center"
        aria-label="Authenticator code"
      >
        <InputOTPGroup className="mx-auto gap-1.5">
          <InputOTPSlot index={0} className="size-10 rounded-lg text-base font-semibold" />
          <InputOTPSlot index={1} className="size-10 rounded-lg text-base font-semibold" />
          <InputOTPSlot index={2} className="size-10 rounded-lg text-base font-semibold" />
          <InputOTPSlot index={3} className="size-10 rounded-lg text-base font-semibold" />
          <InputOTPSlot index={4} className="size-10 rounded-lg text-base font-semibold" />
          <InputOTPSlot index={5} className="size-10 rounded-lg text-base font-semibold" />
        </InputOTPGroup>
      </InputOTP>
      <Button type="submit" disabled={pending || code.length < 6} className="w-full">
        {pending ? "Verifying…" : "Verify"}
      </Button>
    </form>
  );
}
