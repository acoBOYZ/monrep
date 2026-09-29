import type { DockerContainer, SystemdUnit } from "./opsParse";

export const DOCKER_LIST_ARGV = ["docker", "ps", "-a", "--format", "{{json .}}"] as const;

export const SYSTEMD_LIST_ARGV = [
  "systemctl",
  "list-units",
  "--type=service",
  "--all",
  "--no-pager",
  "--no-legend",
  "--plain",
] as const;

export const SYSTEMD_FAILED_ARGV = [
  "systemctl",
  "--failed",
  "--type=service",
  "--no-pager",
  "--no-legend",
  "--plain",
] as const;

export function countBadDocker(items: Array<DockerContainer>): number {
  return items.filter((c) => c.state !== "running" || c.status.toLowerCase().includes("unhealthy"))
    .length;
}

export function countFailedUnits(items: Array<SystemdUnit>): number {
  return items.filter((u) => u.active === "failed" || u.sub === "failed").length;
}
