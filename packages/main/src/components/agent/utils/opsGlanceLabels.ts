import type { BadgeProps } from "@monrep/ui/base";

type GlanceBadge = { variant: NonNullable<BadgeProps["variant"]>; label: string };

export const dockerGlanceBadge = (
  online: boolean,
  scanning: boolean,
  dockerBad: number | null,
): GlanceBadge => {
  if (!online) return { variant: "muted", label: "Offline" };
  if (scanning || dockerBad === null) return { variant: "muted", label: "Scanning…" };
  if (dockerBad === 0) return { variant: "success", label: "All running" };
  return { variant: "destructive", label: `${dockerBad} not running` };
};

export const servicesGlanceBadge = (
  online: boolean,
  scanning: boolean,
  servicesFailed: number | null,
): GlanceBadge => {
  if (!online) return { variant: "muted", label: "Offline" };
  if (scanning || servicesFailed === null) return { variant: "muted", label: "Scanning…" };
  if (servicesFailed === 0) return { variant: "success", label: "No failures" };
  return { variant: "destructive", label: `${servicesFailed} failed` };
};
