import { CollectorsMapSchema } from "./schemas";
import type { CollectorsMap } from "./schemas";

/** Default background collectors — argv authored here (main), not in the agent. */
export const DEFAULT_COLLECTORS: CollectorsMap = {
  monitor: {
    enabled: true,
    intervalSec: 30,
    argv: [
      "/bin/sh",
      "-c",
      "cat /proc/loadavg; free -b 2>/dev/null | awk '/^Mem:/{print \"mem\", $2, $3, $7}'; df -Pk / 2>/dev/null | awk 'NR==2{print \"disk\", $2, $3}'; nproc 2>/dev/null",
    ],
  },
  error: {
    enabled: true,
    intervalSec: 60,
    argv: ["/bin/sh", "-c", "dmesg -T 2>/dev/null | tail -n 20 || true"],
  },
  overload: {
    enabled: true,
    intervalSec: 30,
    argv: ["/bin/sh", "-c", "uptime; echo ---; (command -v free >/dev/null && free -m) || true"],
  },
};

export const defaultCollectorsJson = (): string => JSON.stringify(DEFAULT_COLLECTORS);

export const parseCollectorsJson = (raw: string): CollectorsMap =>
  CollectorsMapSchema.parse(JSON.parse(raw) as unknown);
