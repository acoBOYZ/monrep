import type { ReactNode, RefObject, UIEvent } from "react";
import type {
  PartialKeys,
  ScrollToOptions,
  Virtualizer,
  VirtualizerOptions,
} from "@tanstack/react-virtual";

/**
 * Props for {@link RowVirtualizer}. Any remaining keys are forwarded to
 * `useVirtualizer` (`estimateSize`, `getItemKey`, `overscan`, `count`, …).
 *
 * @typeParam TValue - Item type in `data`.
 * @typeParam TItem - `batch` size. Omit / `1` → `itemContent` gets one `TValue`.
 *   `2+` → `itemContent` gets `Array<TValue>` chunks.
 */
export interface RowVirtualizerProps<TValue, TItem extends number | undefined> extends PartialKeys<
  VirtualizerOptions<HTMLDivElement, Element>,
  "observeElementRect" | "observeElementOffset" | "scrollToFn"
> {
  /**
   * Class on the scroll container (not the inner spacer).
   * @default undefined
   */
  className?: string;
  /**
   * Rows to virtualize. `undefined` is treated as an empty list.
   */
  data: Array<TValue> | undefined;
  /**
   * Render one virtual row. `index` is the virtualizer index (chunk index when `batch > 1`).
   */
  itemContent: (
    index: number,
    item: TItem extends 1 | undefined ? TValue : Array<TValue>,
  ) => ReactNode;
  /**
   * Latest TanStack `Virtualizer` instance (assigned after mount / option changes).
   */
  rowVirtualizerRef?: RefObject<Virtualizer<HTMLDivElement, Element> | null>;
  /**
   * Imperative `scrollToTop` / `scrollToEnd` / `scrollToIndex`.
   */
  scrollControlRef?: RefObject<RowVirtualizerScrollHandle | null>;
  /**
   * `margin-bottom` on each row wrapper (px number or CSS length).
   * @default 0
   */
  itemGap?: number | string;
  /**
   * Native scroll event plus inferred direction vs the previous `scrollTop`.
   */
  onScroll?: (event: UIEvent<HTMLDivElement>, direction: "up" | "down") => void;
  /**
   * Edge callback for the top of the list.
   * @description
   * - Fires `true` when `scrollTop` first enters the dynamic top band
   * - Fires `false` when it leaves
   * - `firstVisible` / `lastVisible` are virtualizer indexes currently in view
   * @default band = sum of the first `topThreshold` mounted item heights
   */
  onScrollToTop?: (state: boolean, firstVisible?: number, lastVisible?: number) => void;
  /**
   * Edge callback for the bottom of the list (load-more).
   * @description Same latch as `onScrollToTop`, using the last `|bottomThreshold|` item heights.
   */
  onScrollToEnd?: (state: boolean, firstVisible?: number, lastVisible?: number) => void;
  /**
   * Sets `overflow-y: hidden` on the scroller.
   * @default false
   */
  scrollLocked?: boolean;
  /**
   * How many leading virtual items (by current range) sum to the top edge band.
   * @default 6
   */
  topThreshold?: number;
  /**
   * Trailing items for the bottom edge band. Absolute value is used (`-3` → last 3).
   * @default -3
   */
  bottomThreshold?: number;
  /**
   * Group `data` into chunks of this size. `itemContent` then receives an array.
   * @default 1
   */
  batch?: TItem;
  /**
   * Slide mounted rows when their `translateY` changes (reorder).
   * @default false
   * @description
   * - `false` / omit: no CSS transition, no start-map work
   * - `true`: `200ms` + `cubic-bezier(0.2, 0, 0, 1)`
   * - `number`: duration in milliseconds
   *
   * Pass a stable `getItemKey` (not the index). Work is O(overscan), not `data.length`.
   *
   * Does **not** run when:
   * - the user is scrolling (`virtualizer.isScrolling`)
   * - `data.length` changed (filter, load-more)
   * - the key was not mounted last frame (first paint, scroll-in, jump from below the fold)
   * - `|Δstart| < 24` (measure jitter)
   * - `prefers-reduced-motion: reduce`
   */
  animateReorder?: boolean | number;
}

/**
 * Handle written to `scrollControlRef`.
 */
export interface RowVirtualizerScrollHandle {
  /**
   * `scrollTop = 0`.
   * @param behavior CSS `ScrollBehavior`. `"instant"` if omitted.
   */
  scrollToTop: (behavior?: ScrollBehavior) => void;
  /**
   * `scrollTop = scrollHeight`.
   * @param behavior CSS `ScrollBehavior`. `"instant"` if omitted.
   */
  scrollToEnd: (behavior?: ScrollBehavior) => void;
  /**
   * Delegates to TanStack `virtualizer.scrollToIndex`.
   * @param index Virtualizer row index (chunk index when `batch > 1`).
   * @param options `align`, `behavior`, etc. from `@tanstack/react-virtual`.
   */
  scrollToIndex: (index: number, options?: ScrollToOptions) => void;
}
