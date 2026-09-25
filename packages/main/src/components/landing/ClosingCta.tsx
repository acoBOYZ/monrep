import { Button } from "@monrep/ui/base";
import { Link } from "@tanstack/react-router";
import { ContentFrame } from "./frame";

export function ClosingCta() {
  return (
    <section className="relative z-10" aria-labelledby="closing-heading">
      <ContentFrame>
        <div className="flex flex-col items-start gap-8 py-20 md:flex-row md:items-center md:justify-between md:py-28">
          <div className="max-w-xl">
            <h2
              id="closing-heading"
              className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              One page. Your whole fleet.
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Open the console when you&apos;re ready — agents connect when the CLI ships.
            </p>
          </div>
          <Button size="lg" className="rounded-full px-7" render={<Link to="/admin" />}>
            Open console
          </Button>
        </div>
      </ContentFrame>
    </section>
  );
}
