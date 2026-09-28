import { Badge, ScrollArea, TooltipTrigger } from "@monrep/ui/base";
import { formatRelative } from "@monrep/utils";
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

export function HealthEventsFeed({ health }: HealthEventsFeedProps) {
  return (
    <section className="flex min-w-0 flex-col gap-2 overflow-hidden overflow-y-auto rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium">Agent health</h2>
        <Badge variant="muted">{health.length}</Badge>
      </div>
      {health.length === 0 ? (
        <p className="text-sm text-muted-foreground">No health events</p>
      ) : (
        <ScrollArea className="max-h-80 min-w-0">
          <ul className="flex min-w-0 flex-col gap-2">
            {health.map((event) => (
              <li key={event.id} className="flex min-w-0 items-start gap-2 text-sm">
                <Badge variant={levelVariant(event.level)} className="shrink-0">
                  {event.level}
                </Badge>
                <span className="shrink-0 font-mono text-xs">{event.code}</span>
                <TooltipTrigger content={event.message} className="min-w-0 flex-1 overflow-hidden">
                  <span className="block min-w-0 truncate">{event.message}</span>
                </TooltipTrigger>
                <TooltipTrigger content={new Date(event.at).toISOString()}>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelative(event.at)}
                  </span>
                </TooltipTrigger>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </section>
  );
}
