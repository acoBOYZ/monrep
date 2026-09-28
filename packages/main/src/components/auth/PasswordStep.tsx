import { useId } from "react";
import { Button, Input, Label, PasswordInput, TextSeparator } from "@monrep/ui/base";
import { ADMIN_EMAIL_DOMAIN } from "../../brand.gen";
import { TurnstileWidget } from "./TurnstileWidget";
import type { SubmitEvent } from "react";

type PasswordStepProps = {
  email: string;
  password: string;
  turnstileSiteKey: string;
  turnstileToken: string;
  pending: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTurnstileToken: (token: string) => void;
  onSubmit: () => void;
  onUsePasskey?: () => void;
};

export function PasswordStep({
  email,
  password,
  turnstileSiteKey,
  turnstileToken,
  pending,
  onEmailChange,
  onPasswordChange,
  onTurnstileToken,
  onSubmit,
  onUsePasskey,
}: PasswordStepProps) {
  const emailId = useId();
  const passwordId = useId();

  const handlePasswordFormSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handlePasswordFormSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder={`admin@${ADMIN_EMAIL_DOMAIN}`}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={passwordId}>Password</Label>
        <PasswordInput
          id={passwordId}
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="••••••••"
        />
      </div>
      <TurnstileWidget siteKey={turnstileSiteKey} onToken={onTurnstileToken} />
      <Button type="submit" disabled={pending || !turnstileToken} className="w-full">
        {pending ? "Signing in…" : "Login"}
      </Button>
      {onUsePasskey ? (
        <>
          <TextSeparator text="Or" />
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            className="w-full"
            onClick={onUsePasskey}
          >
            Continue with passkey
          </Button>
        </>
      ) : null}
    </form>
  );
}
