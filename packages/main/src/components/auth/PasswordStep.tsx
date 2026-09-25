import { Button, Input, PasswordInput } from "@monrep/ui/base";
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
}: PasswordStepProps) {
  const handlePasswordFormSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handlePasswordFormSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-xs font-medium">
        Email
        <Input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="admin@monrep.com"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium">
        Password
        <PasswordInput
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="••••••••"
        />
      </label>
      <TurnstileWidget siteKey={turnstileSiteKey} onToken={onTurnstileToken} />
      <Button type="submit" disabled={pending || !turnstileToken} className="mt-1 w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
