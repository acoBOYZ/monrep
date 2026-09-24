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

export const Route = createFileRoute("/_public/admin")({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const session = await getSession();
    if (session) {
      redirect({ to: DEFAULT_AUTH_REDIRECT, throw: true });
    }
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
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
        data: {
          email,
          password,
          redirect: redirectTo,
        },
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.35_0.04_250_/_0.35),_transparent_55%),radial-gradient(ellipse_at_bottom,_oklch(0.28_0.03_80_/_0.25),_transparent_50%)]"
      />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-3xl font-semibold tracking-tight">monrep</p>
          <p className="mt-2 text-sm text-muted-foreground">Admin sign-in</p>
        </div>

        <form
          onSubmit={submitLogin}
          className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm"
        >
          <label className="flex flex-col gap-1.5 text-xs font-medium">
            Email
            <Input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@monrep.com"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium">
            Password
            <PasswordInput
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </label>
          <Button type="submit" disabled={pending} className="mt-1 w-full">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
