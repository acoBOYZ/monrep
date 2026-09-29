import {
  Activity01Icon,
  Alert01Icon,
  AlertCircleIcon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { storeTimer } from "@monrep/runtime";
import { ScrollArea } from "@monrep/ui/base";
import { cn, formatRelative } from "@monrep/utils";
import { useSelector } from "@tanstack/react-store";
import type { IconSvgElement } from "@hugeicons/react";
import type { HealthEvent } from "@/components/agent/metrics/types";

type HealthEventsPopoverContentProps = {
  health: ReadonlyArray<HealthEvent>;
};

function levelVisual(level: HealthEvent["level"]): {
  icon: IconSvgElement;
  wrap: string;
  iconClass: string;
} {
  if (level === "error") {
    return {
      icon: AlertCircleIcon,
      wrap: "bg-destructive/15",
      iconClass: "text-destructive",
    };
  }
  if (level === "warn") {
    return {
      icon: Alert01Icon,
      wrap: "bg-warning/15",
      iconClass: "text-warning",
    };
  }
  return {
    icon: InformationCircleIcon,
    wrap: "bg-muted/60",
    iconClass: "text-cool",
  };
}

function HealthEventPopoverRow({ event, now }: { event: HealthEvent; now: number }) {
  const visual = levelVisual(event.level);
  const relative = formatRelative(event.at, now);

  return (
    <li className="flex min-w-0 gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted/40">
      <span
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md",
          visual.wrap,
        )}
      >
        <HugeiconsIcon
          icon={visual.icon}
          className={cn("size-3.5", visual.iconClass)}
          aria-hidden
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">
          <span className="font-mono">{event.code}</span>
          <span className="ms-1.5 font-normal text-muted-foreground tabular-nums">{relative}</span>
        </p>
        <p className="truncate text-[0.6875rem] text-muted-foreground">{event.message}</p>
      </div>
    </li>
  );
}

export function HealthEventsPopoverContent({ health }: HealthEventsPopoverContentProps) {
  const secondTick = useSelector(storeTimer, (s) => s.secondTick);
  const now = secondTick * 1000;
  const events = [...health].sort((a, b) => b.at - a.at);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
        <span className="flex size-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <HugeiconsIcon icon={Activity01Icon} className="size-4" aria-hidden />
        </span>
        <p className="text-xs font-medium">No health events</p>
        <p className="text-[0.6875rem] text-muted-foreground">
          Connect and agent alerts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="px-1.5 pt-0.5 text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
        Agent health logs
      </p>
      <ScrollArea className="max-h-72 min-w-0 overflow-y-auto">
        <ul className="flex min-w-0 flex-col pe-1">
          {events.map((event) => (
            <HealthEventPopoverRow key={event.id} event={event} now={now} />
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
