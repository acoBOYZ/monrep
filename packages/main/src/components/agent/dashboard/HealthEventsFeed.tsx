import { Activity01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { storeTimer } from "@monrep/runtime";
import { Badge, ScrollArea, TooltipTrigger } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { formatRelative, toDateTimeAttr } from "@monrep/utils";
import { useSelector } from "@tanstack/react-store";
import type { BadgeProps } from "@monrep/ui/base";
import type { HealthEvent } from "@/components/agent/metrics/types";

type HealthEventsFeedProps = {
  health: ReadonlyArray<HealthEvent>;
};

function levelVariant(level: HealthEvent["level"]): NonNullable<BadgeProps["variant"]> {
  if (level === "warn") return "warning";
  if (level === "error") return "destructive";
  return "muted";
}

function HealthEventRow({ event, now }: { event: HealthEvent; now: number }) {
  const relative = formatRelative(event.at, now);
  const absolute = toDateTimeAttr(new Date(event.at));

  return (
    <li className="flex min-w-0 flex-col gap-1.5 rounded-md border border-border/50 bg-background/40 px-2.5 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <ImpactFlash watch={event.level} className="shrink-0">
          <Badge variant={levelVariant(event.level)} className="capitalize">
            {event.level}
          </Badge>
        </ImpactFlash>
        <span className="min-w-0 truncate font-mono text-xs font-medium">{event.code}</span>
        <TooltipTrigger content={absolute ?? "—"} className="ms-auto shrink-0">
          <time dateTime={absolute} className="text-[0.6875rem] text-muted-foreground tabular-nums">
            {relative}
          </time>
        </TooltipTrigger>
      </div>
      <TooltipTrigger content={event.message} className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{event.message}</p>
      </TooltipTrigger>
    </li>
  );
}

export function HealthEventsFeed({ health }: HealthEventsFeedProps) {
  const secondTick = useSelector(storeTimer, (s) => s.secondTick);
  const now = secondTick * 1000;
  const events = [...health].sort((a, b) => b.at - a.at);

  return (
    <section
      aria-labelledby="health-feed-heading"
      className="flex min-w-0 flex-col gap-3 overflow-hidden rounded-lg border border-border/60 bg-card/40 p-3"
    >
      <div className="flex items-center gap-2">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
          <HugeiconsIcon icon={Activity01Icon} className="size-7 text-primary" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="health-feed-heading" className="text-sm font-semibold">
            Agent health
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            Recent agent and connection events
          </p>
        </div>
        <ImpactFlash watch={events.length} className="shrink-0">
          <Badge variant="muted" className="tabular-nums">
            {events.length}
          </Badge>
        </ImpactFlash>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center">
          <span className="flex size-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
            <HugeiconsIcon icon={Activity01Icon} className="size-4" aria-hidden />
          </span>
          <p className="text-sm font-medium">No health events</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Connect, disconnect, and agent alerts will show up here as they happen.
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-80 min-w-0 overflow-y-auto">
          <ul className="flex min-w-0 flex-col gap-1.5 pe-2">
            {events.map((event) => (
              <HealthEventRow key={event.id} event={event} now={now} />
            ))}
          </ul>
        </ScrollArea>
      )}
    </section>
  );
}
