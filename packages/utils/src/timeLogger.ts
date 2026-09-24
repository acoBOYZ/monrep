const ENABLED = Boolean(false);

const noop = (_label?: string): void => {};

/** Dev-only timing. In production both methods are noops (no Map, no clock). */
export const timeLogger = ENABLED
  ? (() => {
      const starts = new Map<string, number>();
      const nowNs = () => Bun.nanoseconds();

      const formatDuration = (ns: number): string => {
        if (ns >= 1_000_000) return `${(ns / 1_000_000).toFixed(3)}ms`;
        if (ns >= 1_000) return `${(ns / 1_000).toFixed(3)}µs`;
        return `${Math.round(ns)}ns`;
      };

      return {
        start(label: string): void {
          starts.set(label, nowNs());
        },
        end(label: string): void {
          const start = starts.get(label);
          if (start === undefined) {
            console.warn(`timeLogger: no start for "${label}"`);
            return;
          }
          starts.delete(label);
          console.log(`\x1b[36m${label}\x1b[0m: \x1b[33m${formatDuration(nowNs() - start)}\x1b[0m`);
        },
      };
    })()
  : { start: noop, end: noop };
