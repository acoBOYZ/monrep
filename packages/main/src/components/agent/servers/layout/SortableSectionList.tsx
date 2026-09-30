import { useEffect, useEffectEvent } from "react";
import { autoScrollWindowForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge/extract-closest-edge";
import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/utils/combine";
import { useAutoAnimate } from "@monrep/hooks";
import { SortableSection } from "./SortableSection";
import { isServerSectionDragData } from "./sectionIds";
import type { ReactNode } from "react";
import type { ServerSectionId } from "./sectionIds";

type SortableSectionListProps = {
  order: ReadonlyArray<ServerSectionId>;
  sections: Record<ServerSectionId, ReactNode>;
  onReorder: (next: Array<ServerSectionId>) => void;
};

export function SortableSectionList({ order, sections, onReorder }: SortableSectionListProps) {
  const listRef = useAutoAnimate<HTMLDivElement>({ duration: 150, easing: "ease-out" });
  const getOrder = useEffectEvent(() => order);

  useEffect(() => {
    return combine(
      monitorForElements({
        canMonitor: ({ source }) => isServerSectionDragData(source.data),
        onDrop: ({ source, location }) => {
          const target = location.current.dropTargets[0];
          if (
            !target ||
            !isServerSectionDragData(source.data) ||
            !isServerSectionDragData(target.data)
          ) {
            return;
          }

          const current = [...getOrder()];
          const startIndex = current.indexOf(source.data.id);
          const indexOfTarget = current.indexOf(target.data.id);
          if (startIndex < 0 || indexOfTarget < 0) return;

          const next = reorderWithEdge({
            list: current,
            startIndex,
            indexOfTarget,
            closestEdgeOfTarget: extractClosestEdge(target.data),
            axis: "vertical",
          });
          if (next.every((id, i) => id === current[i])) return;
          onReorder(next);
        },
      }),
      autoScrollWindowForElements({
        canScroll: ({ source }) => isServerSectionDragData(source.data),
        getConfiguration: () => ({ maxScrollSpeed: "fast" }),
      }),
    );
  }, [onReorder]);

  return (
    <div ref={listRef} className="flex flex-col gap-3 overflow-visible">
      {order.map((id, index) => (
        <SortableSection key={id} id={id} index={index}>
          {sections[id]}
        </SortableSection>
      ))}
    </div>
  );
}
