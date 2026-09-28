import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge, TooltipTrigger } from "@monrep/ui/base";
import { kpiDeltaVariant } from "./kpiTile.helpers";

type KpiDeltaBadgeProps = {
  delta: number;
  deltaText: string;
  invert?: boolean;
};

export function KpiDeltaBadge({ delta, deltaText, invert }: KpiDeltaBadgeProps) {
  return (
    <TooltipTrigger content="vs previous window">
      <Badge variant={kpiDeltaVariant(delta, invert)} className="gap-0.5 tabular-nums">
        {delta > 0 ? <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" aria-hidden /> : null}
        {delta < 0 ? <HugeiconsIcon icon={ArrowDown01Icon} className="size-3" aria-hidden /> : null}
        {deltaText}
      </Badge>
    </TooltipTrigger>
  );
}
