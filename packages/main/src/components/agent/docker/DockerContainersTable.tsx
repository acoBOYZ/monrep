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
import { DockerContainerRow } from "./DockerContainerRow";
import type { DockerContainer } from "@/components/agent/utils/opsParse";
import { TABLE_HEAD_CLASS } from "@/components/agent/utils/tableStyles";

type DockerContainersTableProps = {
  serverId: string;
  items: Array<DockerContainer>;
  disabled: boolean;
  loading: boolean;
  onStart: (container: DockerContainer) => void;
  onStop: (container: DockerContainer) => void;
  onRestart: (container: DockerContainer) => void;
};

export function DockerContainersTable({
  serverId,
  items,
  disabled,
  loading,
  onStart,
  onStop,
  onRestart,
}: DockerContainersTableProps) {
  const showSkeleton = loading && items.length === 0;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border/60 bg-card/40">
      <ScrollArea className="h-full min-h-0 overflow-y-auto">
        <Table className="min-w-160 table-fixed">
          <TableHeader>
            <TableRow className="h-10 hover:bg-transparent">
              <TableHead className={cn(TABLE_HEAD_CLASS, "w-[28%]")}>Name</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "w-[24%]")}>Image</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "w-20")}>State</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "w-32")}>Ports</TableHead>
              <TableHead className={cn(TABLE_HEAD_CLASS, "w-5")} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {showSkeleton
              ? Array.from({ length: 6 }, (_, i) => (
                  <TableRow key={i} className="h-10">
                    {Array.from({ length: 5 }, (_c, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-32" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}
            {!showSkeleton && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8">
                  <span className="text-sm text-cool">
                    No containers (or Docker unavailable).
                  </span>
                </TableCell>
              </TableRow>
            ) : null}
            {!showSkeleton
              ? items.map((c) => (
                  <DockerContainerRow
                    key={c.id}
                    serverId={serverId}
                    container={c}
                    disabled={disabled}
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
