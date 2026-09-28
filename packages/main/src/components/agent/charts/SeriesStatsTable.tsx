import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@monrep/ui/base";
import { TABLE_HEAD_CLASS } from "@/components/agent/utils/tableStyles";

type SeriesRow = { series: string; at: Date; value: number };

type SeriesStatsTableProps = {
  data: ReadonlyArray<SeriesRow>;
};

export function SeriesStatsTable({ data }: SeriesStatsTableProps) {
  const rows = useMemo(() => {
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
  }, [data]);

  if (rows.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow className="h-9 hover:bg-transparent">
          <TableHead className={TABLE_HEAD_CLASS}>Series</TableHead>
          <TableHead className={TABLE_HEAD_CLASS}>Latest</TableHead>
          <TableHead className={TABLE_HEAD_CLASS}>Min</TableHead>
          <TableHead className={TABLE_HEAD_CLASS}>Max</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.name} className="h-9">
            <TableCell className="text-sm">{row.name}</TableCell>
            <TableCell className="font-mono text-xs tabular-nums">
              {row.latest?.toFixed(2) ?? "—"}
            </TableCell>
            <TableCell className="font-mono text-xs tabular-nums">
              {row.min?.toFixed(2) ?? "—"}
            </TableCell>
            <TableCell className="font-mono text-xs tabular-nums">
              {row.max?.toFixed(2) ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
