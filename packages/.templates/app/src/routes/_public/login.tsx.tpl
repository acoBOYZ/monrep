import { useState } from "react";
import { Button, Input, PasswordInput, toast } from "@monrep/ui/base";
import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import type { SubmitEvent } from "react";
import { getSession, loginFn } from "@/server/auth/functions";
import { DEFAULT_AUTH_REDIRECT, authErrorMessage } from "@/server/auth/schemas";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

const safeNavigatePath = (value: string | undefined): string => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }
  return value;
};

export const Route = createFileRoute("/_public/login")({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const session = await getSession();
    if (session) {
      redirect({ to: DEFAULT_AUTH_REDIRECT, throw: true });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const submitLogin = async (event: SubmitEvent) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const result = await loginFn({
        data: { email, password, redirect: redirectTo },
      });
      if (!result.ok) {
        toast.error(authErrorMessage(result.error));
        setPending(false);
        return;
      }
      await navigate({ href: safeNavigatePath(redirectTo) });
    } catch (error) {
      setPending(false);
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
    }
  };

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-3xl font-semibold tracking-tight">{{name}}</p>
          <p className="mt-2 text-sm text-muted-foreground">Sign in</p>
        </div>

        <form
          onSubmit={submitLogin}
          className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card/80 p-6 shadow-sm"
        >
          <label className="flex flex-col gap-1.5 text-xs font-medium">
            Email
            <Input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@{{name}}.local"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium">
            Password
            <PasswordInput
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <Button type="submit" disabled={pending} className="mt-1 w-full">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">
            Home
          </Link>
        </p>
      </div>
    </main>
  );
}
