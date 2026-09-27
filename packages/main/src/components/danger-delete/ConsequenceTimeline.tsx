import { cn } from "@monrep/utils";
import type { ReactNode } from "react";

export type ConsequenceItem = { id: string; content: ReactNode };

type ConsequenceTimelineProps = {
  items: Array<ConsequenceItem>;
};

/**
 * Flex-only layout: no negative offsets, no absolutely positioned spine.
 * Prevents subpixel bleed from step 2 into step 3 after the timeline unmounts.
 */
export function ConsequenceTimeline({ items }: ConsequenceTimelineProps) {
  if (items.length === 0) return null;

  return (
    <ul className="m-0 list-none space-y-0 p-0">
      {items.map((item, index) => (
        <li key={item.id} className="flex min-w-0 gap-3">
          <div className="flex w-3 shrink-0 flex-col items-center">
            <div className="flex justify-center pt-1.5">
              <span className="size-1.5 shrink-0 rounded-full bg-foreground" aria-hidden />
            </div>
            {index < items.length - 1 ? (
              <div className="mx-auto min-h-3 w-px flex-1 bg-border" aria-hidden />
            ) : null}
          </div>
          <div
            className={cn(
              "min-w-0 flex-1 text-[13px] leading-relaxed",
              index < items.length - 1 && "pb-6",
            )}
          >
            {item.content}
          </div>
        </li>
      ))}
    </ul>
  );
}
