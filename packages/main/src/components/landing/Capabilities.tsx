import { ContainerIcon, ScrollTextIcon, TerminalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@monrep/utils";
import { ContentFrame } from "./frame";
import type { IconSvgElement } from "@hugeicons/react";

type Capability = {
  title: string;
  description: string;
  icon: IconSvgElement;
};

const CAPABILITIES: Array<Capability> = [
  {
    title: "Docker",
    description: "Manage containers from the browser.",
    icon: ContainerIcon,
  },
  {
    title: "Live shell",
    description: "Run commands without SSH juggling.",
    icon: TerminalIcon,
  },
  {
    title: "Realtime logs",
    description: "Stream output as it happens.",
    icon: ScrollTextIcon,
  },
];

export function Capabilities() {
  return (
    <section
      id="capabilities"
      className="relative z-10 scroll-mt-20 py-6 md:py-10"
      aria-labelledby="capabilities-heading"
    >
      <ContentFrame>
        <h2 id="capabilities-heading" className="sr-only">
          Capabilities
        </h2>
        <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
          {CAPABILITIES.map((cap, index) => (
            <article
              key={cap.title}
              className={cn(
                "py-10 md:px-6 md:py-12 lg:px-8",
                index > 0 && "border-t border-border/50 md:border-t-0 md:border-l",
                index === 0 && "md:pl-0",
                index === CAPABILITIES.length - 1 && "md:pr-0",
              )}
            >
              <span className="mb-4 flex size-10 items-center justify-center text-foreground">
                <HugeiconsIcon icon={cap.icon} strokeWidth={1.75} className="size-6" />
              </span>
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                {cap.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {cap.description}
              </p>
            </article>
          ))}
        </div>
      </ContentFrame>
    </section>
  );
}
