import { Skeleton } from "@monrep/ui/base";

export function KpiTileSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border/60 bg-card/40">
      <div className="flex flex-col gap-2 px-3 pt-3 pb-2">
        <Skeleton className="h-3 w-24" />
        <div className="flex items-baseline gap-1.5">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-none" />
    </div>
  );
}
