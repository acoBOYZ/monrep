import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@monrep/ui/base";
import { seriesStats } from "./seriesStats";
import type { SeriesPoint } from "./seriesStats";
import { TABLE_HEAD_CLASS } from "@/components/agent/utils/tableStyles";

type SeriesStatsTableProps = {
  data: ReadonlyArray<SeriesPoint>;
};

export function SeriesStatsTable({ data }: SeriesStatsTableProps) {
  const rows = useMemo(() => seriesStats(data), [data]);

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
