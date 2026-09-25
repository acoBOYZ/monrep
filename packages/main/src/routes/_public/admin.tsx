import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { LogoLink } from "@/components/LogoLink";
import { PasskeyEnrollStep } from "@/components/auth/PasskeyEnrollStep";
import { PasskeyStep } from "@/components/auth/PasskeyStep";
import { PasswordStep } from "@/components/auth/PasswordStep";
import { TotpEnrollStep } from "@/components/auth/TotpEnrollStep";
import { TotpVerifyStep } from "@/components/auth/TotpVerifyStep";
import { useAdminLoginFlow } from "@/components/auth/useAdminLoginFlow";
import { PageLoader } from "@/components/pages/PageLoader";
import { getSession } from "@/server/auth/functions";
import { DEFAULT_AUTH_REDIRECT } from "@/server/auth/schemas";

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
  const flow = useAdminLoginFlow(async () => {
    await navigate({ href: safeNavigatePath(redirectTo) });
  });

  if (flow.step === "loading") {
    return <PageLoader />;
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-sm">
        <header className="mb-8 flex flex-col items-center gap-6">
          <LogoLink />
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Welcome to monrep</h1>
            <p className="mt-2 text-sm text-muted-foreground">Admin sign-in</p>
          </div>
        </header>

        <div className="flex flex-col gap-4">
          {flow.step === "passkey" ? (
            <PasskeyStep
              email={flow.email}
              pending={flow.pending}
              onStart={flow.startPasskeyLogin}
              onVerified={flow.verifyPasskeyLogin}
              onFallbackPassword={() => flow.setStep("password")}
            />
          ) : null}

          {flow.step === "password" && flow.turnstileSiteKey ? (
            <PasswordStep
              email={flow.email}
              password={flow.password}
              turnstileSiteKey={flow.turnstileSiteKey}
              turnstileToken={flow.turnstileToken}
              pending={flow.pending}
              onEmailChange={flow.setEmail}
              onPasswordChange={flow.setPassword}
              onTurnstileToken={flow.setTurnstileToken}
              onSubmit={() => void flow.submitPassword()}
              onUsePasskey={flow.canUsePasskey ? () => flow.setStep("passkey") : undefined}
            />
          ) : null}

          {flow.step === "enroll_totp" ? (
            <TotpEnrollStep
              otpauth={flow.otpauth}
              secret={flow.totpSecret}
              code={flow.totpCode}
              pending={flow.pending}
              onCodeChange={flow.setTotpCode}
              onConfirm={() => void flow.confirmTotpEnroll()}
            />
          ) : null}

          {flow.step === "totp" ? (
            <TotpVerifyStep
              code={flow.totpCode}
              pending={flow.pending}
              onCodeChange={flow.setTotpCode}
              onVerify={() => void flow.verifyTotp()}
            />
          ) : null}

          {flow.step === "enroll_passkey" ? (
            <PasskeyEnrollStep
              pending={flow.pending}
              onStart={flow.startPasskeyRegister}
              onVerified={flow.verifyPasskeyRegister}
              onSkip={() => void flow.skipPasskeyEnroll()}
            />
          ) : null}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
