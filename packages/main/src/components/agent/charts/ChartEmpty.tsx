import { ChartSplineIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type ChartEmptyProps = {
  height: number;
  message?: string;
};

export function ChartEmpty({
  height,
  message = "No metrics yet - collectors post every 30 s",
}: ChartEmptyProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/60 bg-muted/20 px-4 text-center"
      style={{ height }}
    >
      <span className="flex size-9 items-center justify-center rounded-lg border border-dashed bg-muted/60 text-muted-foreground">
        <HugeiconsIcon icon={ChartSplineIcon} className="size-5" strokeWidth={2} aria-hidden />
      </span>
      <p className="max-w-xs text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
