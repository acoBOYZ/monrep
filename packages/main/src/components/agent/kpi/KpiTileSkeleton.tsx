import { Skeleton } from "@monrep/ui/base";

export function KpiTileSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-border/50 bg-card/30 p-2.5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-1 h-10 w-full" />
    </div>
  );
}
