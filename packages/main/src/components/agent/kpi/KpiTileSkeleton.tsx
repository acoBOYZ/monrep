import { Skeleton } from "@monrep/ui/base";

export function KpiTileSkeleton() {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card/40 p-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-1 h-10 w-full" />
    </div>
  );
}
