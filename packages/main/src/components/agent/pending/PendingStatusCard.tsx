import { storeTimer } from "@monrep/runtime";
import { CopyableButton, TooltipTrigger } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { formatElapsed, formatRelative } from "@monrep/utils";
import { useSelector } from "@tanstack/react-store";

type PendingStatusCardProps = {
  serverId: string;
  createdAt?: string;
};

export function PendingStatusCard({ serverId, createdAt }: PendingStatusCardProps) {
  const now = useSelector(storeTimer, (s) => s.now);
  const createdMs = createdAt ? Date.parse(createdAt) : Number.NaN;
  const elapsedLabel = Number.isFinite(createdMs) ? formatElapsed(now - createdMs) : "—";
  const createdRelative = Number.isFinite(createdMs) ? formatRelative(createdMs, now) : "—";

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-4">
      <h2 className="text-sm font-medium">Status</h2>
      <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        <dt className="text-xs text-muted-foreground">Server id</dt>
        <dd>
          <CopyableButton variant="inline" text={serverId} />
        </dd>
        <dt className="text-xs text-muted-foreground">Created</dt>
        <dd>
          <TooltipTrigger content={createdAt ?? "—"}>
            <span className="font-mono text-xs tabular-nums">{createdRelative}</span>
          </TooltipTrigger>
        </dd>
        <dt className="text-xs text-muted-foreground">Waiting</dt>
        <dd>
          <ImpactFlash watch={elapsedLabel}>
            <span className="font-mono text-xs tabular-nums">{elapsedLabel}</span>
          </ImpactFlash>
        </dd>
        <dd className="col-span-2">
          <p className="text-xs text-muted-foreground">
            Agent has not connected yet. This page switches to the live view automatically once the
            agent connects.
          </p>
        </dd>
      </dl>
    </div>
  );
}
