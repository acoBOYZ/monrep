import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import type { UIEvent } from "react";
import type { Range, ScrollToOptions } from "@tanstack/react-virtual";
import type { RowVirtualizerProps } from "./types";

/**
 * Empty fallback when `data` is omitted. Shared instance — do not mutate.
 */
const EMPTY_ROWS: ReadonlyArray<unknown> = [];

/** Default reorder duration when `animateReorder` is `true`. */
const REORDER_MS = 200;
/** Decelerate-out curve for reorder `transform` (Material standard-ish). */
const REORDER_EASE = "cubic-bezier(0.2, 0, 0, 1)";
/**
 * Minimum `|Δstart|` to treat as a reorder, not a measure correction.
 * Conversation rows are ~86px; jitter is typically a few pixels.
 */
const MIN_REORDER_PX = 24;
/**
 * Cached `prefers-reduced-motion` query. `.matches` is read on render (no listener).
 * `null` during SSR.
 */
const reducedMotion =
  typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");

/**
 * Virtualized vertical list: spacer + absolutely positioned rows, scroll-edge
 * latches, optional reorder motion.
 *
 * @typeParam TValue - Item type in `data`.
 * @typeParam TItem - See {@link RowVirtualizerProps} `batch`.
 */
export const RowVirtualizer = <TValue, TItem extends number | undefined = undefined>({
  className,
  data = EMPTY_ROWS as Array<TValue>,
  itemContent,
  rowVirtualizerRef,
  scrollControlRef,
  itemGap = 0,
  onScroll,
  onScrollToTop,
  onScrollToEnd,
  scrollLocked = false,
  topThreshold = 6,
  bottomThreshold = -3,
  batch = 1,
  animateReorder = false,
  ...virtualizerOptions
}: RowVirtualizerProps<TValue, TItem>) => {
  const defaultRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTop = useRef(0);
  const hasScrolledToTop = useRef(false);
  const hasScrolledToEnd = useRef(false);
  const prevStartsRef = useRef(new Map<unknown, number>());
  const prevCountRef = useRef<number | null>(null);

  const isBatching = batch > 1;
  const rows = useMemo(() => {
    if (!isBatching) {
      return data;
    }

    const out: Array<Array<TValue>> = [];
    for (let i = 0; i < data.length; i += batch) {
      out.push(data.slice(i, i + batch));
    }
    return out;
  }, [data, isBatching, batch]);

  // oxlint-disable-next-line react/incompatible-library -- TanStack Virtual returns unstable function identities
  const virtualizer = useVirtualizer({
    ...virtualizerOptions,
    count: rows.length,
    getScrollElement: () => defaultRef.current,
    rangeExtractor: useCallback((range: Range) => {
      return defaultRangeExtractor(range);
    }, []),
  });

  const reorderMs = animateReorder === true ? REORDER_MS : animateReorder || 0;
  const virtualItems = virtualizer.getVirtualItems();
  const countChanged = prevCountRef.current != null && prevCountRef.current !== rows.length;
  const allowReorder =
    reorderMs > 0 && !countChanged && !virtualizer.isScrolling && !reducedMotion?.matches;
  const rowTransition = useMemo(
    () => (reorderMs > 0 ? `transform ${reorderMs}ms ${REORDER_EASE}` : undefined),
    [reorderMs],
  );

  useLayoutEffect(() => {
    if (reorderMs <= 0) {
      prevStartsRef.current.clear();
      prevCountRef.current = null;
      return;
    }
    prevCountRef.current = rows.length;
    const prevStarts = prevStartsRef.current;
    prevStarts.clear();
    for (const vi of virtualItems) prevStarts.set(vi.key, vi.start);
  }, [reorderMs, rows.length, virtualItems]);

  useEffect(() => {
    if (!rowVirtualizerRef) return;
    rowVirtualizerRef.current = virtualizer;
  }, [rowVirtualizerRef, virtualizer]);

  const scrollToTop = useCallback((behavior?: ScrollBehavior) => {
    if (defaultRef.current) {
      defaultRef.current.scrollTo({
        top: 0,
        behavior: behavior || "instant",
      });
    }
  }, []);

  const scrollToEnd = useCallback((behavior?: ScrollBehavior) => {
    if (defaultRef.current) {
      defaultRef.current.scrollTo({
        top: defaultRef.current.scrollHeight,
        behavior: behavior || "instant",
      });
    }
  }, []);

  useImperativeHandle(
    scrollControlRef,
    () => ({
      scrollToTop,
      scrollToEnd,
      scrollToIndex: (index: number, options: ScrollToOptions | undefined) => {
        virtualizer.scrollToIndex(index, options);
      },
    }),
    [scrollToTop, scrollToEnd, virtualizer],
  );

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (!defaultRef.current) return;

      const el = defaultRef.current;
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight;
      const clientHeight = el.clientHeight;
      const scrollBottom = scrollTop + clientHeight;
      const direction = scrollTop > lastScrollTop.current ? "down" : "up";
      lastScrollTop.current = scrollTop;

      onScroll?.(event, direction);

      const items = virtualizer.getVirtualItems();

      let firstVisibleIndex: number | undefined;
      let lastVisibleIndex: number | undefined;

      for (const item of items) {
        const itemStart = item.start;
        const itemEnd = item.start + item.size;

        const isVisible = itemEnd >= scrollTop && itemStart <= scrollBottom;

        if (isVisible) {
          if (firstVisibleIndex === undefined) firstVisibleIndex = item.index;
          lastVisibleIndex = item.index;
        }
      }

      const top3 = items.slice(0, topThreshold);
      const dynamicTopThreshold = top3.reduce((sum, item) => sum + item.size, 0);

      const last3 = items.slice(-Math.abs(bottomThreshold));
      const dynamicBottomThreshold = last3.reduce((sum, item) => sum + item.size, 0);

      const isAtTop = scrollTop <= dynamicTopThreshold;
      const isAtBottom = scrollHeight - scrollTop - clientHeight <= dynamicBottomThreshold;

      if (onScrollToTop) {
        if (isAtTop && !hasScrolledToTop.current) {
          hasScrolledToTop.current = true;
          onScrollToTop(true, firstVisibleIndex, lastVisibleIndex);
        } else if (!isAtTop && hasScrolledToTop.current) {
          hasScrolledToTop.current = false;
          onScrollToTop(false, firstVisibleIndex, lastVisibleIndex);
        }
      }

      if (onScrollToEnd) {
        if (isAtBottom && !hasScrolledToEnd.current) {
          hasScrolledToEnd.current = true;
          onScrollToEnd(true, firstVisibleIndex, lastVisibleIndex);
        } else if (!isAtBottom && hasScrolledToEnd.current) {
          hasScrolledToEnd.current = false;
          onScrollToEnd(false, firstVisibleIndex, lastVisibleIndex);
        }
      }
    },
    [onScroll, onScrollToTop, onScrollToEnd, topThreshold, bottomThreshold, virtualizer],
  );

  return (
    <div
      ref={defaultRef}
      className={className}
      style={{
        overflowY: scrollLocked ? "hidden" : "auto",
        maxHeight: "100%",
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
        }}
        data-motion-off={!allowReorder ? "" : undefined}
      >
        {virtualItems.map((vi) => {
          const row = rows[vi.index];
          const prevStart = prevStartsRef.current.get(vi.key);
          const animateRow =
            allowReorder && prevStart != null && Math.abs(prevStart - vi.start) >= MIN_REORDER_PX;
          return (
            <div
              key={vi.key}
              ref={(el) => {
                if (el) virtualizer.measureElement(el);
              }}
              data-index={vi.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transition: animateRow ? rowTransition : undefined,
                transform: `translateY(${vi.start}px)`,
              }}
            >
              <div style={{ width: "100%", marginBottom: itemGap }}>
                {row &&
                  itemContent(
                    vi.index,
                    row as TItem extends 1 | undefined ? TValue : Array<TValue>,
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
