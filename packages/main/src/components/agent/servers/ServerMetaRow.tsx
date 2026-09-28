import {
  Clock01Icon,
  CpuIcon,
  FingerPrintIcon,
  HardDriveIcon,
  PackageIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { storeTimer } from "@monrep/runtime";
import { CopyableButton, TooltipTrigger } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { formatRelative, toDateTimeAttr } from "@monrep/utils";
import { useSelector } from "@tanstack/react-store";
import type { ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import type { MetricPoint } from "@/components/agent/metrics/types";
import type { TServerDo } from "@/db/types";

type ServerMetaRowProps = {
  server: TServerDo;
  latest?: MetricPoint;
};

type MetaCellProps = {
  icon: IconSvgElement;
  label: string;
  children: ReactNode;
};

function MetaCell({ icon, label, children }: MetaCellProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border border-border/60 bg-card/40 px-3 py-2">
      <dt className="flex items-center gap-1.5 text-[0.6875rem] leading-none tracking-wide text-muted-foreground uppercase">
        <HugeiconsIcon icon={icon} className="size-3.5 shrink-0" aria-hidden />
        {label}
      </dt>
      <dd className="flex min-w-0 items-center text-sm leading-tight">{children}</dd>
    </div>
  );
}

const Empty = () => <span className="font-mono text-muted-foreground">—</span>;

export function ServerMetaRow({ server, latest }: ServerMetaRowProps) {
  const secondTick = useSelector(storeTimer, (s) => s.secondTick);
  const lastSeenIso = server.lastSeenAt;
  const lastSeenMs = lastSeenIso ? Date.parse(lastSeenIso) : Number.NaN;
  const lastSeenValid = Number.isFinite(lastSeenMs);
  const lastSeenRelative = lastSeenValid ? formatRelative(lastSeenMs, secondTick * 1000) : "—";
  const lastSeenFull = lastSeenValid ? toDateTimeAttr(lastSeenIso) : undefined;

  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      <MetaCell icon={FingerPrintIcon} label="Device">
        {server.deviceId ? (
          <CopyableButton variant="inline" text={server.deviceId} className="font-mono" />
        ) : (
          <Empty />
        )}
      </MetaCell>
      <MetaCell icon={Clock01Icon} label="Last seen">
        {lastSeenValid ? (
          <TooltipTrigger content={lastSeenFull} className="min-w-0">
            <ImpactFlash
              watch={lastSeenRelative}
              className="truncate font-mono text-foreground tabular-nums"
            >
              <time dateTime={lastSeenFull}>{lastSeenRelative}</time>
            </ImpactFlash>
          </TooltipTrigger>
        ) : (
          <Empty />
        )}
      </MetaCell>
      <MetaCell icon={PackageIcon} label="Agent">
        <ImpactFlash watch={server.agentVersion} className="truncate font-mono text-foreground">
          v{server.agentVersion ?? "—"}
        </ImpactFlash>
      </MetaCell>
      <MetaCell icon={CpuIcon} label="Cores">
        {latest?.cores !== undefined ? (
          <span className="font-mono tabular-nums">{latest.cores}</span>
        ) : (
          <Empty />
        )}
      </MetaCell>
      <MetaCell icon={HardDriveIcon} label="Disk">
        {latest?.diskPct !== undefined ? (
          <ImpactFlash watch={latest.diskPct.toFixed(1)} className="font-mono tabular-nums">
            {latest.diskPct.toFixed(1)}%
          </ImpactFlash>
        ) : (
          <Empty />
        )}
      </MetaCell>
    </dl>
  );
}
