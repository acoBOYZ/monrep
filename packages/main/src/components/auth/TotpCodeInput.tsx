import { InputOTP, InputOTPGroup, InputOTPSlot } from "@monrep/ui/base";

type TotpCodeInputProps = {
  code: string;
  onCodeChange: (value: string) => void;
};

export function TotpCodeInput({ code, onCodeChange }: TotpCodeInputProps) {
  const handleCodeChange = (value: string) => {
    onCodeChange(value.replace(/\D/g, "").slice(0, 6));
  };

  return (
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
  );
}
