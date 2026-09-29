import { Skeleton } from "@monrep/ui/base";

export function KpiTileSkeleton() {
  return (
    <div className="flex min-h-31 flex-col overflow-hidden rounded-lg border border-border/60 bg-card/40">
      <div className="flex flex-col gap-2 px-3 pt-3 pb-2">
        <Skeleton className="h-3.5 w-24" />
        <div className="flex min-h-9 items-baseline gap-1.5">
          <Skeleton className="h-8 w-20 sm:h-9" />
          <Skeleton className="h-4 w-10" />
        </div>
      </div>
      <Skeleton className="mt-auto h-10 w-full shrink-0 rounded-none" />
    </div>
  );
}
