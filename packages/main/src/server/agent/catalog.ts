import { CollectorsMapSchema } from "./schemas";
import type { CollectorsMap } from "./schemas";

/**
 * Default background collectors — argv authored here (main), not in the agent.
 * Placeholders until real metric scripts land in Phase 2+.
 */
export const DEFAULT_COLLECTORS: CollectorsMap = {
  monitor: {
    enabled: true,
    intervalSec: 30,
    argv: ["/bin/sh", "-c", "uname -a; echo ---; date -u +%Y-%m-%dT%H:%M:%SZ"],
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
