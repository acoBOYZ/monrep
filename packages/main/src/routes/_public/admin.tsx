import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { LogoLink } from "@/components/LogoLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminLoginSteps } from "@/components/auth/AdminLoginSteps";
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
    <main className="relative flex min-h-svh flex-col items-center justify-center bg-background px-6 text-foreground">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <header className="mb-8 flex flex-col items-center gap-4">
          <LogoLink titleAs="span" />
          <h1 className="text-lg font-semibold tracking-tight">Admin sign-in</h1>
        </header>

        <AdminLoginSteps flow={flow} />

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
