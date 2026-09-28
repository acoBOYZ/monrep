import { ContentFrame } from "./ContentFrame";
import { LandingStage } from "./LandingStage";
import { MarketingFooter } from "./MarketingFooter";
import { MarketingNav } from "./MarketingNav";
import { PageGutterHatches } from "./PageGutterHatches";

/** Public `/` — single-viewport console-style landing. */
export function MarketingHome() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <MarketingNav />
      <div className="relative flex flex-1 flex-col overflow-x-hidden px-3 min-[1280px]:px-0">
        <PageGutterHatches />
        <main className="relative z-10 flex flex-1 flex-col">
          <ContentFrame className="flex flex-1 flex-col justify-center py-8">
            <LandingStage />
          </ContentFrame>
        </main>
        <MarketingFooter />
      </div>
    </div>
  );
}
