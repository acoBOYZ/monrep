import { Button } from "@monrep/ui/base";
import { Link } from "@tanstack/react-router";
import { ContentFrame } from "./frame";

const HERO_GLOW_STYLE = {
  backgroundImage:
    "radial-gradient(ellipse at bottom, color-mix(in oklab, var(--primary-foreground) 28%, transparent), transparent 70%)",
} as const;

export function Hero() {
  return (
    <section className="relative z-10 pt-3 md:pt-4">
      <ContentFrame inset={false}>
        <div className="relative overflow-hidden rounded-2xl bg-primary text-center text-primary-foreground md:rounded-3xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{
              backgroundImage:
                "radial-gradient(circle, color-mix(in oklab, var(--foreground) 40%, transparent) 1px, transparent 1.5px)",
              backgroundSize: "14px 14px",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-48"
            style={HERO_GLOW_STYLE}
          />

          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 py-20 md:px-10 md:py-28">
            <span className="mb-6 inline-flex items-center rounded-full border border-primary-foreground/25 bg-foreground/10 px-3 py-1 text-xs font-medium tracking-wide text-primary-foreground/90">
              Realtime control plane
            </span>
            <h1 className="text-4xl leading-tight font-medium tracking-tight text-primary-foreground md:text-5xl lg:text-[3.25rem]">
              Manage your server infra from one web page. Realtime.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/75 md:text-lg">
              Install a CLI agent on each box; control Docker, shell, logs, and monitors from the
              browser. One control plane, many servers.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="rounded-full bg-primary-foreground px-7 text-primary hover:bg-primary-foreground/90"
                render={<Link to="/admin" />}
              >
                Open console
              </Button>
              <a
                href="#get-started"
                className="inline-flex h-10 items-center justify-center rounded-full border-2 border-primary-foreground bg-primary-foreground/20 px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/35"
              >
                Install agent
              </a>
            </div>
          </div>
        </div>
      </ContentFrame>
    </section>
  );
}
