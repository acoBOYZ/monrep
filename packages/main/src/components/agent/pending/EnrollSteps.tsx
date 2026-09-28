import { EnrollStep } from "./EnrollStep";
import { INSTALL_COMMAND } from "@/brand.gen";

type EnrollStepsProps = {
  enrollToken?: string | null;
  expiresAt?: string;
};

export function EnrollSteps({ enrollToken, expiresAt }: EnrollStepsProps) {
  const controlUrl = typeof window !== "undefined" ? window.location.origin : "";
  const hasToken = Boolean(enrollToken);
  const enrollCommand = hasToken
    ? `monrep enroll --url ${controlUrl} --token ${enrollToken}`
    : `monrep enroll --url ${controlUrl} --token <enroll-token>`;
  const expiresHint =
    hasToken && expiresAt ? (
      <span className="font-mono">Expires {expiresAt.slice(0, 19)}</span>
    ) : undefined;
  const securityCopy = hasToken
    ? "This token is shown only once. Leaving or refreshing this page hides it; we do not store the plaintext again. On a previously enrolled host, run monrep unenroll first."
    : "The enroll token was shown once at create time and cannot be retrieved. If you lost it, revoke this server and add it again. On a previously enrolled host, run monrep unenroll first.";

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-4">
      <h2 className="text-sm font-medium">Connect this host</h2>
      <ol className="mt-3 flex flex-col gap-4">
        <EnrollStep index={1} heading="Install the agent" command={INSTALL_COMMAND} />
        <EnrollStep index={2} heading="Enroll" command={enrollCommand} note={expiresHint} />
        <EnrollStep index={3} heading="Start the daemon" command="monrep daemon" />
      </ol>
      <p className="mt-4 text-xs text-muted-foreground">{securityCopy}</p>
    </div>
  );
}
