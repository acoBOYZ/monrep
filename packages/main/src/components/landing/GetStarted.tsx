import { CopyableButton } from "@monrep/ui/base";
import { INSTALL_COMMAND } from "../../brand.gen";
import { ContentFrame } from "./frame";

/**
 * Install one-liner — served from this Worker at `INSTALL_PATH` (brand.json).
 */

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
            A small CLI stays connected to the control plane. Run this on each Linux host, then
            enroll with the one-time token from Add server.
          </p>
          <CopyableButton
            text={INSTALL_COMMAND}
            variant="block"
            className="mt-8 overflow-hidden rounded-lg bg-muted/10 text-foreground hover:bg-muted/15 focus-visible:ring-muted/40"
          >
            <pre className="min-w-0 flex-1 overflow-x-auto p-2 px-4 pr-12 font-mono text-xs leading-relaxed text-background sm:text-sm">
              <code>{INSTALL_COMMAND}</code>
            </pre>
          </CopyableButton>
        </div>
      </ContentFrame>
    </section>
  );
}
