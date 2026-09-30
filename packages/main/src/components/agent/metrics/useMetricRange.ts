import { useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "@monrep/hooks";
import { RANGE_MS, isMetricRange } from "./types";
import type { MetricRange } from "./types";

const NON_IMPURTIVE_NOW_FN = () => Date.now();
const STORAGE_KEY = "metrics:range";
const DEFAULT_RANGE: MetricRange = "24h";

export function useMetricRange() {
  const [stored, setRange] = useLocalStorage<MetricRange>(STORAGE_KEY, DEFAULT_RANGE);
  const [to, setTo] = useState(NON_IMPURTIVE_NOW_FN);

  useEffect(() => {
    if (!isMetricRange(stored)) setRange(DEFAULT_RANGE);
  }, [stored, setRange]);

  useEffect(() => {
    const id = window.setInterval(() => setTo(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const range = isMetricRange(stored) ? stored : DEFAULT_RANGE;
  const from = useMemo(() => to - RANGE_MS[range], [to, range]);

  return { range, setRange, from, to };
}
