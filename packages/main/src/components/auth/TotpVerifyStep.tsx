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

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    onVerify();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-center text-sm text-muted-foreground">
        Enter the 6-digit code from your authenticator app.
      </p>
      <label className="flex flex-col gap-1.5 text-xs font-medium">
        Authenticator code
        <InputOTP
          maxLength={6}
          value={code}
          onChange={handleCodeChange}
          containerClassName="justify-center"
        >
          <InputOTPGroup className="mx-auto gap-1">
            <InputOTPSlot
              index={0}
              className="size-9 rounded-lg text-base font-semibold sm:size-10"
            />
            <InputOTPSlot
              index={1}
              className="size-9 rounded-lg text-base font-semibold sm:size-10"
            />
            <InputOTPSlot
              index={2}
              className="size-9 rounded-lg text-base font-semibold sm:size-10"
            />
            <InputOTPSlot
              index={3}
              className="size-9 rounded-lg text-base font-semibold sm:size-10"
            />
            <InputOTPSlot
              index={4}
              className="size-9 rounded-lg text-base font-semibold sm:size-10"
            />
            <InputOTPSlot
              index={5}
              className="size-9 rounded-lg text-base font-semibold sm:size-10"
            />
          </InputOTPGroup>
        </InputOTP>
      </label>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Verifying…" : "Verify"}
      </Button>
    </form>
  );
}
