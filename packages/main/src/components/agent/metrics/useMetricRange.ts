import { useEffect, useMemo, useState } from "react";
import { RANGE_MS } from "./types";
import type { MetricRange } from "./types";

export function useMetricRange(initial: MetricRange = "1h") {
  const [range, setRange] = useState<MetricRange>(initial);
  const [to, setTo] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setTo(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const from = useMemo(() => to - RANGE_MS[range], [to, range]);

  return { range, setRange, from, to };
}
