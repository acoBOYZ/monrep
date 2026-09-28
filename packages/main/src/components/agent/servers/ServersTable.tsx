import {
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@monrep/ui/base";
import { cn } from "@monrep/utils";
import { Link } from "@tanstack/react-router";
import { ServerRow } from "./ServerRow";
import type { TServerDo } from "@/db/types";
import { TABLE_HEAD_CLASS } from "@/components/agent/utils/tableStyles";

type ServersTableProps = {
  rows: Array<TServerDo>;
  isReady: boolean;
};

export function ServersTable({ rows, isReady }: ServersTableProps) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-lg border border-border/60 bg-card/40">
      <Table className="min-w-xl table-fixed">
        <TableHeader>
          <TableRow className="h-10 hover:bg-transparent">
            <TableHead className={TABLE_HEAD_CLASS}>Name</TableHead>
            <TableHead className={TABLE_HEAD_CLASS}>Status</TableHead>
            <TableHead className={TABLE_HEAD_CLASS}>Device</TableHead>
            <TableHead className={TABLE_HEAD_CLASS}>Agent</TableHead>
            <TableHead className={TABLE_HEAD_CLASS}>Last seen</TableHead>
            <TableHead className={cn(TABLE_HEAD_CLASS, "text-right")}>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isReady ? (
            Array.from({ length: 5 }, (_, i) => (
              <TableRow key={i} className="h-10">
                {Array.from({ length: 6 }, (_cell, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full max-w-32" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center">
                <span className="text-sm text-muted-foreground">No servers yet.</span>{" "}
                <Button
                  nativeButton={false}
                  render={<Link to="/servers/new" />}
                  size="sm"
                  variant="outline"
                >
                  Add server
                </Button>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => <ServerRow key={row.id ?? row.name} server={row} />)
          )}
        </TableBody>
      </Table>
    </div>
  );
}
