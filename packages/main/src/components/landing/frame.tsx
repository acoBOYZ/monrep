import { cn } from "@monrep/utils";
import type { ReactNode } from "react";

/** Cloudflare-style content column (~1200px). Side gutters hold margin guides only. */
export const FRAME_MAX = "max-w-[1200px]";
export const FRAME_CLASS = "mx-auto w-full max-w-[1200px]";
/** Inset from L/R guide lines so text never kisses the dashed edges. */
export const FRAME_INSET = "px-4 md:px-6 lg:px-8";

type ContentFrameProps = {
  children: ReactNode;
  className?: string;
  /** When false, children kiss the L/R guides (hero plane, section rules). Default true. */
  inset?: boolean;
};

/** Centered wrapper — children align to the shared column frame. */
export function ContentFrame({ children, className, inset = true }: ContentFrameProps) {
  return <div className={cn(FRAME_CLASS, inset && FRAME_INSET, className)}>{children}</div>;
}

type SectionRuleProps = {
  className?: string;
};

/**
 * Full-bleed horizontal dashed rule (viewport edge → edge).
 * Junction ticks only where the rule meets the content L/R guides.
 */
export function SectionRule({ className }: SectionRuleProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none relative z-0 h-0 w-full", className)}
    >
      <div className="absolute top-0 left-1/2 w-screen -translate-x-1/2 border-t border-dashed border-border/60" />
      <span className="absolute top-0 left-0 size-1 -translate-x-1/2 -translate-y-1/2 bg-border/60" />
      <span className="absolute top-0 right-0 size-1 translate-x-1/2 -translate-y-1/2 bg-border/60" />
    </div>
  );
}

/**
 * Region:Earth-style guides — one dashed vertical line per content edge (L + R).
 * Full page height; no dense hatch cluster; no mid-page guides.
 */
export function PageGutterHatches() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className={cn(FRAME_CLASS, "relative h-full")}>
        <div className="absolute inset-y-0 left-0 border-l border-dashed border-border/60" />
        <div className="absolute inset-y-0 right-0 border-r border-dashed border-border/60" />
      </div>
    </div>
  );
}

/** @deprecated Use PageGutterHatches */
export const PageColumnGuides = PageGutterHatches;
