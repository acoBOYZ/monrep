import { Capabilities } from "./Capabilities";
import { ClosingCta } from "./ClosingCta";
import { ConsoleStage } from "./ConsoleStage";
import { GetStarted } from "./GetStarted";
import { Hero } from "./Hero";
import { MarketingFooter } from "./MarketingFooter";
import { MarketingNav } from "./MarketingNav";
import { PageGutterHatches } from "./frame";

/** Marketing `/` — primary hero plane, console stage, open capabilities, Region guides. */
export function MarketingHome() {
  return (
    <div className="relative min-h-dvh bg-background">
      {/* Sticky must not sit under overflow-x-hidden (breaks position:sticky). */}
      <MarketingNav />
      <div className="relative overflow-x-hidden px-3 min-[1280px]:px-0">
        <PageGutterHatches />
        <main className="relative z-10 flex flex-1 flex-col">
          <Hero />
          <ConsoleStage />
          <Capabilities />
          <GetStarted />
          <ClosingCta />
        </main>
        <MarketingFooter />
      </div>
    </div>
  );
}
