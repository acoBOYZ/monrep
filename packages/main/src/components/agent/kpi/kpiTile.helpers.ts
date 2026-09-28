import type { BadgeProps } from "@monrep/ui/base";

export function kpiDeltaVariant(
  delta: number | undefined,
  invert?: boolean,
): NonNullable<BadgeProps["variant"]> {
  if (delta === undefined || delta === 0) return "muted";
  const improving = invert ? delta < 0 : delta > 0;
  return improving ? "success" : "destructive";
}

export function formatKpiDelta(
  delta: number | undefined,
  deltaFormat?: (d: number) => string,
): string | null {
  if (delta === undefined) return null;
  return deltaFormat ? deltaFormat(delta) : `${delta > 0 ? "+" : ""}${delta}`;
}
