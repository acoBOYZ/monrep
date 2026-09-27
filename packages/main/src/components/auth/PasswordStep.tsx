import { useId } from "react";
import { Button, Input, PasswordInput, TextSeparator } from "@monrep/ui/base";
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
      <label htmlFor={emailId} className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <Input
          id={emailId}
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="admin@monrep.com"
        />
      </label>
      <label htmlFor={passwordId} className="flex flex-col gap-1.5 text-sm font-medium">
        Password
        <PasswordInput
          id={passwordId}
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="••••••••"
        />
      </label>
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
