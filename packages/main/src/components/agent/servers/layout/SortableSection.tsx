import { useEffect, useRef, useState } from "react";
import { attachClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge/attach-closest-edge";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge/extract-closest-edge";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/utils/combine";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/utils/set-custom-native-drag-preview";
import { DragDropVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@monrep/utils";
import { SECTION_LABEL, isServerSectionDragData, sectionDragData } from "./sectionIds";
import { mountSectionPreview } from "./sectionPreview";
import type { ReactNode } from "react";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";
import type { ServerSectionId } from "./sectionIds";

type SortableSectionProps = {
  id: ServerSectionId;
  index: number;
  children: ReactNode;
};

export function SortableSection({ id, index, children }: SortableSectionProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLButtonElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    const handle = handleRef.current;
    if (!element || !handle) return;

    return combine(
      draggable({
        element,
        dragHandle: handle,
        getInitialData: () => sectionDragData(id, index),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: () => ({ x: 12, y: 12 }),
            render: ({ container }) => {
              mountSectionPreview(container, SECTION_LABEL[id]);
            },
          });
        },
        onDragStart: () => setDragging(true),
        onDrop: () => setDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => isServerSectionDragData(source.data),
        getIsSticky: () => true,
        getData: ({ input, element: el }) =>
          attachClosestEdge(sectionDragData(id, index), {
            element: el,
            input,
            allowedEdges: ["top", "bottom"],
          }),
        onDragEnter: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
        onDrag: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
        onDragLeave: () => setClosestEdge(null),
        onDrop: () => setClosestEdge(null),
      }),
    );
  }, [id, index]);

  return (
    <div
      ref={elementRef}
      data-section={id}
      className={cn("group/section relative min-w-0", dragging && "opacity-40")}
    >
      {closestEdge === "top" ? (
        <div className="pointer-events-none absolute inset-x-0 -top-px z-10 h-0.5 rounded-full bg-primary" />
      ) : null}
      {children}
      <button
        ref={handleRef}
        type="button"
        aria-label={`Reorder ${SECTION_LABEL[id]}`}
        className={cn(
          "absolute top-1 -right-8 z-20 inline-flex size-7 cursor-grab items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground shadow-sm",
          "opacity-0 transition-opacity group-hover/section:opacity-100 focus-visible:opacity-100",
          "hover:bg-muted hover:text-foreground active:cursor-grabbing",
          dragging && "opacity-100",
        )}
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} className="size-4" aria-hidden />
      </button>
      {closestEdge === "bottom" ? (
        <div className="pointer-events-none absolute inset-x-0 -bottom-px z-10 h-0.5 rounded-full bg-primary" />
      ) : null}
    </div>
  );
}
