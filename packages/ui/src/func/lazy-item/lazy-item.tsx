import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { benchMount, benchVisible } from "./bench";
import { useIntersection } from "./useIntersection";
import type {
  CSSProperties,
  ElementType,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  Ref,
  RefObject,
} from "react";

export type LazyItemRoot = Element | null | RefObject<Element | null> | (() => Element | null);

export type LazyItemProps = {
  minHeight?: number;
  rootMargin?: string;
  root?: LazyItemRoot;
  skeleton?: ReactNode | (() => ReactNode);
  animate?: boolean;
  animationSide?: "left" | "right";
  id?: string;
  /** Unmounts content when off-screen and remounts when back in view using skeleton as placeholder. */
  recycle?: boolean;
  /**
   * How far outside the viewport (in px) an item must travel before being unmounted.
   * Larger values keep more items alive during fast scrolling. Only applies when recycle=true.
   * @default "1200px"
   */
  exitMargin?: string;
  /** Clones a single child and applies LazyItem props directly to it, avoiding wrapper divs. */
  asChild?: boolean;
} & PropsWithChildren;

type AsChildProps = {
  style?: CSSProperties;
  "data-order"?: string;
  children?: ReactNode;
};
type AsChildElement = ReactElement<AsChildProps> & { ref?: Ref<HTMLElement | null> };

export const LazyItem = ({
  minHeight,
  rootMargin = "333px",
  root,
  skeleton,
  animate,
  animationSide = "left",
  id,
  recycle = false,
  exitMargin = "1200px",
  asChild = false,
  children,
}: LazyItemProps) => {
  const benchKey = id ?? "default";
  const finalMinHeight = minHeight ?? 120;
  const finalAnimate = animate ?? true;
  const finalSkeleton = skeleton ?? null;

  const [visible, setVisible] = useState(false);
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);
  const innerRef = useRef<HTMLElement | null>(null);
  const lockedHeightRef = useRef<number | null>(null);

  const handleVisible = useCallback(() => {
    benchVisible(benchKey);
    setVisible(true);
  }, [benchKey]);

  const handleHidden = useCallback(() => {
    setVisible(false);
  }, []);

  const options = useMemo(() => ({ rootMargin }), [rootMargin]);
  const exitOptions = useMemo(() => ({ rootMargin: exitMargin }), [exitMargin]);

  const intersectionRef = useIntersection<HTMLElement>(
    handleVisible,
    options,
    root,
    id,
    recycle ? handleHidden : undefined,
    recycle ? exitOptions : undefined,
  );

  useEffect(() => {
    benchMount(benchKey);
  }, [benchKey]);

  useLayoutEffect(() => {
    if (!recycle || !visible) return;
    const el = innerRef.current;
    if (!el) return;

    const measure = () => {
      const raw = el.offsetHeight;
      const h = Math.max(raw, finalMinHeight);
      if (h > 0 && h !== lockedHeightRef.current) {
        lockedHeightRef.current = h;
        setLockedHeight(h);
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [visible, recycle, finalMinHeight]);

  const renderSkeleton = typeof finalSkeleton === "function" ? finalSkeleton() : finalSkeleton;
  const placeholderHeight =
    lockedHeight !== null ? Math.max(lockedHeight, finalMinHeight) : finalMinHeight;
  const animatedStyles: CSSProperties = useMemo(
    () =>
      finalAnimate
        ? {
            opacity: visible ? 1 : 0,
            transform: visible
              ? "translateX(0) translateY(0)"
              : animationSide === "left"
                ? "translateX(-9px) translateY(3px)"
                : "translateX(9px) translateY(3px)",
            transition: "opacity .18s ease-out, transform .18s ease-out",
          }
        : recycle
          ? {}
          : {
              opacity: visible ? 1 : 0,
              transition: "opacity .12s ease-out",
            },
    [finalAnimate, recycle, visible, animationSide],
  );

  const innerStyle: CSSProperties = useMemo(
    () => ({
      ...animatedStyles,
      ...(recycle && !visible ? { minHeight: `${placeholderHeight}px` } : {}),
    }),
    [animatedStyles, recycle, visible, placeholderHeight],
  );

  const setIntersectionRef = useCallback(
    (node: HTMLElement | null) => {
      intersectionRef.current = node;
    },
    [intersectionRef],
  );

  const setInnerRef = useCallback((node: HTMLElement | null) => {
    innerRef.current = node;
  }, []);

  const assignHostNode = useCallback(
    (node: HTMLElement | null) => {
      intersectionRef.current = node;
      innerRef.current = node;
    },
    [intersectionRef],
  );

  useLayoutEffect(() => {
    if (!asChild || !isValidElement(children)) return;
    const child = Children.only(children) as AsChildElement;
    const forwarded = (child.props as AsChildProps & { ref?: Ref<HTMLElement | null> }).ref;
    const node = innerRef.current;
    if (typeof forwarded === "function") {
      forwarded(node);
      return () => {
        void forwarded(null);
      };
    }
    if (forwarded) {
      forwarded.current = node;
      return () => {
        forwarded.current = null;
      };
    }
  }, [asChild, children]);

  if (asChild && isValidElement(children)) {
    const child = Children.only(children) as AsChildElement;
    const nextStyle = {
      minHeight: `${placeholderHeight}px`,
      ...animatedStyles,
      ...child.props.style,
      ...(recycle && !visible ? { minHeight: `${placeholderHeight}px` } : {}),
    };
    const dataOrder = child.props["data-order"] ?? "";
    const Host = child.type as ElementType<AsChildProps & { ref?: Ref<HTMLElement | null> }>;
    return (
      <Host {...child.props} ref={assignHostNode} style={nextStyle} data-order={dataOrder}>
        <LazyItemContent visible={visible} renderSkeleton={renderSkeleton}>
          {children}
        </LazyItemContent>
      </Host>
    );
  }

  return (
    <div ref={setIntersectionRef} data-order="">
      <div ref={setInnerRef} style={innerStyle}>
        <LazyItemContent visible={visible} renderSkeleton={renderSkeleton}>
          {children}
        </LazyItemContent>
      </div>
    </div>
  );
};

type LazyItemContentProps = {
  children: ReactNode;
  visible: boolean;
  renderSkeleton: ReactNode;
};

const LazyItemContent = ({ children, visible, renderSkeleton }: LazyItemContentProps) => {
  return visible ? children : renderSkeleton;
};
