import { Badge, Progress, Skeleton, TableCell, TableRow, TooltipTrigger } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { formatRelative } from "@monrep/utils";
import { Link } from "@tanstack/react-router";
import type { MetricPoint } from "@/components/agent/metrics/types";
import type { TServerDo } from "@/db/types";
import { serverStatusVariant } from "@/components/agent/utils/serverStatus";

type FleetRowProps = {
  server: TServerDo & { id: string };
  latest?: MetricPoint;
  msgs: number;
};

export function FleetRow({ server, latest, msgs }: FleetRowProps) {
  const lastSeen = server.lastSeenAt;
  const lastMs = lastSeen ? Date.parse(lastSeen) : Number.NaN;
  const lastRelative = Number.isFinite(lastMs) ? formatRelative(lastMs) : "—";
  const cores = latest?.cores;
  const load1 = latest?.load1;
  const loadPct =
    load1 !== undefined && typeof cores === "number" && cores > 0
      ? Math.min(100, (load1 / cores) * 100)
      : undefined;
  const memPct = latest?.memPct;

  return (
    <TableRow className="h-10">
      <TableCell className="font-medium">
        <Link to="/servers/$id" params={{ id: server.id }} className="hover:underline">
          {server.name}
        </Link>
      </TableCell>
      <TableCell>
        <ImpactFlash watch={server.status}>
          <Badge variant={serverStatusVariant(server.status)} className="capitalize">
            {server.status}
          </Badge>
        </ImpactFlash>
      </TableCell>
      <TableCell>
        {load1 !== undefined ? (
          <TooltipTrigger
            content={`${load1.toFixed(2)} / ${latest?.load5?.toFixed(2) ?? "—"} / ${latest?.load15?.toFixed(2) ?? "—"}`}
          >
            <div className="flex min-w-20 flex-col gap-1">
              <span className="font-mono text-xs tabular-nums">{load1.toFixed(2)}</span>
              {loadPct !== undefined ? <Progress value={loadPct} className="w-full" /> : null}
            </div>
          </TooltipTrigger>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {memPct !== undefined ? (
          <div className="flex min-w-20 flex-col gap-1">
            <span className="font-mono text-xs tabular-nums">{memPct.toFixed(1)}%</span>
            <Progress value={memPct} className="w-full" />
          </div>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">{msgs}</TableCell>
      <TableCell className="font-mono text-xs">
        <ImpactFlash watch={lastSeen}>
          {lastSeen ? (
            <TooltipTrigger content={lastSeen}>
              <span>{lastRelative}</span>
            </TooltipTrigger>
          ) : (
            "—"
          )}
        </ImpactFlash>
      </TableCell>
    </TableRow>
  );
}

export function FleetRowSkeleton() {
  return (
    <TableRow className="h-10">
      {Array.from({ length: 6 }, (_c, j) => (
        <TableCell key={j}>
          <Skeleton className="h-4 w-full max-w-32" />
        </TableCell>
      ))}
    </TableRow>
  );
}
