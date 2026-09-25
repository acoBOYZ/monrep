import { CopyableButton } from "@monrep/ui/base";
import { ContentFrame } from "./frame";

/**
 * Placeholder until the CLI agent is published.
 * README: "Until that package is published, there is nothing to `curl | sh` yet."
 */
const INSTALL_COMMAND = "curl -fsSL https://get.monrep.dev/install.sh | sh";

export function GetStarted() {
  return (
    <section
      id="get-started"
      className="relative z-10 scroll-mt-20"
      aria-labelledby="get-started-heading"
    >
      <ContentFrame>
        <div className="rounded-2xl bg-foreground px-6 py-16 text-background md:px-10 md:py-20">
          <p className="text-xs font-medium tracking-wide text-background/50 uppercase">
            Get started
          </p>
          <h2
            id="get-started-heading"
            className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl"
          >
            Install the agent on each server
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-background/65 md:text-base">
            A small CLI stays connected to the control plane. The install script is not published
            yet. When it is, this is the command you&apos;ll run.
          </p>
          <CopyableButton
            text={INSTALL_COMMAND}
            variant="block"
            className="mt-8 overflow-hidden rounded-lg bg-background/10 text-background hover:bg-background/15 focus-visible:ring-background/40"
          >
            <pre className="min-w-0 flex-1 overflow-x-auto p-2 px-4 pr-12 font-mono text-sm leading-relaxed text-background">
              <code>{INSTALL_COMMAND}</code>
            </pre>
          </CopyableButton>
        </div>
      </ContentFrame>
    </section>
  );
}
