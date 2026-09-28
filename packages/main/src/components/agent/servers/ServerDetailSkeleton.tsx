import { Skeleton } from "@monrep/ui/base";

export function ServerDetailSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-4 w-full max-w-xl" />
      <Skeleton className="h-90 w-full rounded-lg" />
    </main>
  );
}
