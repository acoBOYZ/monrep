import { FolderLockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";

type DeleteEntityHeroProps = {
  displayName: string;
  metadata?: ReactNode;
  compact?: boolean;
};

export function DeleteEntityHero({ displayName, metadata, compact }: DeleteEntityHeroProps) {
  return (
    <div className={compact ? "space-y-3 py-1" : "space-y-4 py-2"}>
      <div className="flex justify-center">
        <div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-cool">
          <HugeiconsIcon icon={FolderLockIcon} className="size-9 shrink-0" aria-hidden />
        </div>
      </div>
      <div className="space-y-2 text-center">
        <p className="text-xl font-semibold tracking-tight text-foreground">{displayName}</p>
        {metadata ? (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-cool">
            {metadata}
          </div>
        ) : null}
      </div>
    </div>
  );
}
