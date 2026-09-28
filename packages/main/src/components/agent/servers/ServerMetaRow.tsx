import { CopyableButton, TooltipTrigger } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { toDateTimeAttr } from "@monrep/utils";
import type { MetricPoint } from "@/components/agent/metrics/types";
import type { TServerDo } from "@/db/types";

type ServerMetaRowProps = {
  server: TServerDo;
  latest?: MetricPoint;
};

export function ServerMetaRow({ server, latest }: ServerMetaRowProps) {
  const deviceId = server.deviceId;
  const lastSeenIso = server.lastSeenAt;
  const lastSeenShort = lastSeenIso
    ? (toDateTimeAttr(lastSeenIso)?.slice(0, 19) ?? lastSeenIso.slice(0, 19))
    : "—";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span>Device</span>
      {deviceId ? (
        <CopyableButton variant="inline" text={deviceId} />
      ) : (
        <span className="font-mono text-xs">—</span>
      )}
      <span>Last seen</span>
      {lastSeenIso ? (
        <TooltipTrigger content={lastSeenIso}>
          <ImpactFlash watch={lastSeenShort} className="font-mono text-xs text-foreground">
            {lastSeenShort}
          </ImpactFlash>
        </TooltipTrigger>
      ) : (
        <span className="font-mono text-xs text-foreground">—</span>
      )}
      <span>Agent</span>
      <ImpactFlash watch={server.agentVersion} className="font-mono text-xs text-foreground">
        {server.agentVersion ?? "—"}
      </ImpactFlash>
      {latest?.cores !== undefined ? (
        <>
          <span>Cores</span>
          <span className="font-mono text-xs text-foreground">{latest.cores}</span>
        </>
      ) : null}
      {latest?.diskPct !== undefined ? (
        <>
          <span>Disk</span>
          <span className="font-mono text-xs text-foreground">{latest.diskPct.toFixed(1)}%</span>
        </>
      ) : null}
    </div>
  );
}
