import { formatRelative } from "@monrep/utils";
import type { BadgeProps } from "@monrep/ui/base";
import type { HealthEvent } from "@/components/agent/metrics/types";

export function dockerDetail(total: number | null, bad: number | null, online: boolean): string {
  if (!online) return "Agent offline";
  if (total === null || bad === null) return "Scanning fleet state";
  const noun = total === 1 ? "container" : "containers";
  if (bad === 0) return `${total} ${noun} · all running`;
  return `${total} ${noun} · ${bad} not running`;
}

export function servicesDetail(failed: number | null, online: boolean): string {
  if (!online) return "Agent offline";
  if (failed === null) return "Scanning fleet state";
  if (failed === 0) return "0 failed units";
  return `${failed} failed units`;
}

function healthLevelVariant(level: HealthEvent["level"]): NonNullable<BadgeProps["variant"]> {
  if (level === "error") return "destructive";
  if (level === "warn") return "warning";
  return "muted";
}

export function healthGlanceFromEvents(health: ReadonlyArray<HealthEvent>) {
  let event: HealthEvent | undefined;
  for (const e of health) {
    if (!event || e.at > event.at) event = e;
  }
  return {
    event,
    watch: event?.id ?? "none",
    badgeVariant: event ? healthLevelVariant(event.level) : ("muted" as const),
    badgeLabel: event ? event.level : "no events",
    detail: event ? `${event.code} · ${formatRelative(event.at)}` : "No health events yet",
  };
}
