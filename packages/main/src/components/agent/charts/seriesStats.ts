export type SeriesPoint = { series: string; at: Date; value: number };

export type SeriesStats = {
  name: string;
  latest?: number;
  min?: number;
  max?: number;
  lastAt: number;
};

/**
 * Aggregate min/max/latest per series for legends and expand tables.
 * Rows keep first-appearance order so legend index N matches palette color N.
 */
export function seriesStats(data: ReadonlyArray<SeriesPoint>): Array<SeriesStats> {
  const map = new Map<string, { latest?: number; min?: number; max?: number; lastAt: number }>();
  for (const row of data) {
    const t = row.at.getTime();
    const cur = map.get(row.series);
    if (!cur) {
      map.set(row.series, { latest: row.value, min: row.value, max: row.value, lastAt: t });
      continue;
    }
    if (row.value < (cur.min ?? row.value)) cur.min = row.value;
    if (row.value > (cur.max ?? row.value)) cur.max = row.value;
    if (t >= cur.lastAt) {
      cur.lastAt = t;
      cur.latest = row.value;
    }
  }
  return [...map.entries()].map(([name, stats]) => ({ name, ...stats }));
}
