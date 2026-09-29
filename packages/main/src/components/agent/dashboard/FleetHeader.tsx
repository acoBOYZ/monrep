import { ServerIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge, Button } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { Link } from "@tanstack/react-router";
import type { MetricRange } from "@/components/agent/metrics/types";
import { RangeTabs } from "@/components/agent/charts/RangeTabs";

type FleetHeaderProps = {
  online: number;
  offline: number;
  pending: number;
  range: MetricRange;
  onRangeChange: (value: MetricRange) => void;
};

export function FleetHeader({ online, offline, pending, range, onRangeChange }: FleetHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold tracking-tight">Fleet</h1>
        <ImpactFlash watch={online}>
          <Badge variant="success">{online} online</Badge>
        </ImpactFlash>
        {offline > 0 ? (
          <ImpactFlash watch={offline}>
            <Badge variant="destructive">{offline} offline</Badge>
          </ImpactFlash>
        ) : null}
        {pending > 0 ? (
          <ImpactFlash watch={pending}>
            <Badge variant="warning">{pending} pending</Badge>
          </ImpactFlash>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <RangeTabs value={range} onChange={onRangeChange} />
        <Button nativeButton={false} size="sm" render={<Link to="/servers" />}>
          <HugeiconsIcon icon={ServerIcon} className="size-4" />
          Servers
        </Button>
      </div>
    </div>
  );
}
