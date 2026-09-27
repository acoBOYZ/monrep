import { eq, useLiveQuery } from "@tanstack/react-db";
import { useStreamDb } from "@/db/useStreamDb";

type SamplePanelsProps = {
  serverId: string;
};

const KINDS = ["monitor", "error", "overload", "health"] as const;

export function SamplePanels({ serverId }: SamplePanelsProps) {
  const { db, isReady } = useStreamDb("agent");
  const live = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q
        .from({ s: db.collections.sample })
        .where(({ s }) => eq(s.serverId, serverId))
        .orderBy(({ s }) => s.at, "desc");
    },
  });
  const rows = live.data ?? [];

  if (!isReady) {
    return <p className="mt-4 text-sm text-cool">Loading samples…</p>;
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold tracking-tight">Samples</h2>
      <p className="mt-1 text-xs text-cool">
        Recent collector and health payloads. Lean charts when numbers parse; otherwise raw text.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {KINDS.map((kind) => {
          const kindRows = rows.filter((r) => r.kind === kind).slice(0, 24);
          const series = kindRows
            .map((row) => extractNumeric(previewPayload(row.payloadJson)))
            .filter((n): n is number => n !== null)
            .reverse();
          const listRows = kindRows.slice(0, 8);
          return (
            <div key={kind} className="rounded-md border border-border/60 bg-card/40 p-3">
              <h3 className="text-xs font-semibold tracking-wide text-cool uppercase">{kind}</h3>
              {series.length >= 2 ? <Sparkline values={series} label={kind} /> : null}
              {listRows.length === 0 ? (
                <p className="mt-2 text-xs text-cool">No samples yet.</p>
              ) : (
                <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto font-mono text-[11px]">
                  {listRows.map((row) => (
                    <li
                      key={row.id ?? `${row.at}-${kind}`}
                      className="border-t border-border/40 pt-2"
                    >
                      <div className="text-cool">{row.at.slice(0, 19)}</div>
                      <pre className="mt-1 break-all whitespace-pre-wrap text-foreground/90">
                        {previewPayload(row.payloadJson)}
                      </pre>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const previewPayload = (raw: string): string => {
  try {
    const parsed = JSON.parse(raw) as {
      body?: { line?: string; stream?: string; message?: string };
      op?: string;
    };
    if (typeof parsed.body?.line === "string") return parsed.body.line;
    if (typeof parsed.body?.message === "string") return parsed.body.message;
    return JSON.stringify(parsed.body ?? parsed, null, 0).slice(0, 400);
  } catch {
    return raw.slice(0, 400);
  }
};

/** Prefer load averages / Mem: used / first float in text. */
const extractNumeric = (text: string): number | null => {
  const load = text.match(/load average[s]?:\s*([\d.]+)/i);
  if (load?.[1]) return Number(load[1]);
  const mem = text.match(/Mem:\s+\d+\s+(\d+)/);
  if (mem?.[1]) return Number(mem[1]);
  const any = text.match(/(?<![\w.])(\d+(?:\.\d+)?)(?![\w.])/);
  if (any?.[1]) return Number(any[1]);
  return null;
};

function Sparkline({ values, label }: { values: Array<number>; label: string }) {
  const w = 240;
  const h = 48;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * (w - 4) + 2;
      const y = h - 4 - ((v - min) / span) * (h - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const latest = values[values.length - 1];
  return (
    <div className="mt-2">
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        className="h-12 max-w-full text-primary"
        aria-label={`${label} trend, latest ${latest}`}
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={pts}
        />
      </svg>
      <p className="text-[11px] text-cool">
        n={values.length} · last {latest} · range {min}–{max}
      </p>
    </div>
  );
}
