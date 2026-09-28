import {
  ScrollArea,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@monrep/ui/base";
import { cn } from "@monrep/utils";
import { ServiceUnitRow } from "./ServiceUnitRow";
import type { SystemdUnit } from "@/components/agent/utils/opsParse";
import { TABLE_HEAD_CLASS } from "@/components/agent/utils/tableStyles";

type ServicesUnitsTableProps = {
  items: Array<SystemdUnit>;
  selectedKey: string | null;
  disabled: boolean;
  loading: boolean;
  onSelect: (unit: string) => void;
  onStatus: (unit: SystemdUnit) => void;
  onLogs: (unit: SystemdUnit) => void;
  onStart: (unit: SystemdUnit) => void;
  onStop: (unit: SystemdUnit) => void;
  onRestart: (unit: SystemdUnit) => void;
};

export function ServicesUnitsTable({
  items,
  selectedKey,
  disabled,
  loading,
  onSelect,
  onStatus,
  onLogs,
  onStart,
  onStop,
  onRestart,
}: ServicesUnitsTableProps) {
  const showSkeleton = loading && items.length === 0;

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/60 bg-card/40">
      <ScrollArea className="h-full min-h-0">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="h-10 hover:bg-transparent">
              <TableHead className={TABLE_HEAD_CLASS}>Unit</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "w-28")}>Active</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "w-[36%]")}>Description</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "w-36 text-right")}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showSkeleton
              ? Array.from({ length: 6 }, (_, i) => (
                  <TableRow key={i} className="h-10">
                    {Array.from({ length: 4 }, (_c, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-32" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}
            {!showSkeleton && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8">
                  <span className="text-sm text-muted-foreground">No matching units.</span>
                </TableCell>
              </TableRow>
            ) : null}
            {!showSkeleton
              ? items.map((u) => (
                  <ServiceUnitRow
                    key={u.unit}
                    unit={u}
                    selected={u.unit === selectedKey}
                    disabled={disabled}
                    onSelect={onSelect}
                    onStatus={onStatus}
                    onLogs={onLogs}
                    onStart={onStart}
                    onStop={onStop}
                    onRestart={onRestart}
                  />
                ))
              : null}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
