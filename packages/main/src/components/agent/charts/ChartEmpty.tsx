import { Skeleton } from "@monrep/ui/base";

const BAR_HEIGHTS = [
  { id: "b1", ratio: 0.35 },
  { id: "b2", ratio: 0.55 },
  { id: "b3", ratio: 0.42 },
  { id: "b4", ratio: 0.68 },
  { id: "b5", ratio: 0.48 },
  { id: "b6", ratio: 0.62 },
  { id: "b7", ratio: 0.38 },
] as const;

type ChartEmptyProps = {
  height: number;
  message?: string;
};

export function ChartEmpty({
  height,
  message = "No metrics yet - collectors post every 30 s",
}: ChartEmptyProps) {
  return (
    <div className="flex flex-col gap-2" style={{ height }}>
      <div className="flex min-h-0 flex-1 items-end gap-1 px-1" style={{ height: height - 24 }}>
        {BAR_HEIGHTS.map((bar) => (
          <Skeleton
            key={bar.id}
            className="h-[inherit] min-h-0 flex-1"
            style={{ height: `${Math.round(bar.ratio * (height - 32))}px` }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
