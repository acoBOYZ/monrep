import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@monrep/ui/base";
import { FleetRow, FleetRowSkeleton } from "./FleetRow";
import type { ErrorRun, MetricPoint } from "@/components/agent/metrics/types";
import type { TServerDo } from "@/db/types";
import { TABLE_HEAD_CLASS } from "@/components/agent/utils/tableStyles";

type FleetTableProps = {
  servers: ReadonlyArray<TServerDo>;
  isReady: boolean;
  latest: Map<string, MetricPoint>;
  errors: ReadonlyArray<ErrorRun>;
};

export function FleetTable({ servers, isReady, latest, errors }: FleetTableProps) {
  const msgsByServer = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of errors) {
      map.set(e.serverId, (map.get(e.serverId) ?? 0) + e.newLines);
    }
    return map;
  }, [errors]);

  const rows = useMemo(
    () => servers.filter((s): s is TServerDo & { id: string } => typeof s.id === "string"),
    [servers],
  );

  return (
    <div className="min-w-0 overflow-x-auto rounded-lg border border-border/60 bg-card/40">
      <Table className="min-w-160 table-fixed">
        <TableHeader>
          <TableRow className="h-10 hover:bg-transparent">
            <TableHead className={TABLE_HEAD_CLASS}>Name</TableHead>
            <TableHead className={TABLE_HEAD_CLASS}>Status</TableHead>
            <TableHead className={TABLE_HEAD_CLASS}>Load 1m</TableHead>
            <TableHead className={TABLE_HEAD_CLASS}>Mem %</TableHead>
            <TableHead className={TABLE_HEAD_CLASS}>Msgs</TableHead>
            <TableHead className={TABLE_HEAD_CLASS}>Last seen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isReady ? (
            Array.from({ length: 5 }, (_, i) => <FleetRowSkeleton key={i} />)
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                No servers in fleet
              </TableCell>
            </TableRow>
          ) : (
            rows.map((s) => (
              <FleetRow
                key={s.id}
                server={s}
                latest={latest.get(s.id)}
                msgs={msgsByServer.get(s.id) ?? 0}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
