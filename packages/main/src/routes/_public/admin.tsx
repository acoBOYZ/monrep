import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
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
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.35_0.04_250/0.35),transparent_55%),radial-gradient(ellipse_at_bottom,oklch(0.28_0.03_80/0.25),transparent_50%)]"
      />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-3xl font-semibold tracking-tight">monrep</p>
          <p className="mt-2 text-sm text-muted-foreground">Admin sign-in</p>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
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

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
