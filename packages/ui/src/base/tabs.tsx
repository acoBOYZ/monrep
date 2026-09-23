import { createContext, use, useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@monrep/utils";
import {
  tabsListIndicatorVariants,
  tabsListUnderlineVariants,
  tabsListVariants,
  tabsTriggerUnderlineVariants,
  tabsTriggerVariants,
} from "./tabs.variants";
import type { VariantProps } from "class-variance-authority";

/* -------------------- Generic helpers -------------------- */

type TabsValue = string;
type TabsSize = NonNullable<VariantProps<typeof tabsTriggerVariants>["size"]>;

const TabsSizeContext = createContext<{ size: TabsSize }>({
  size: "default",
});

export type TabsRootProps<T extends TabsValue> = Omit<
  TabsPrimitive.Root.Props,
  "value" | "defaultValue" | "onValueChange"
> & {
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
};

export type TabsTriggerProps<T extends TabsValue> = Omit<TabsPrimitive.Tab.Props, "value"> &
  VariantProps<typeof tabsTriggerVariants> & {
    value: T;
  };

export type TabsContentProps<T extends TabsValue> = Omit<TabsPrimitive.Panel.Props, "value"> & {
  value: T;
};

type TabsListProps = TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>;

type TabsListUnderlineProps = TabsPrimitive.List.Props &
  VariantProps<typeof tabsListUnderlineVariants>;

/* ------------------------ Tabs --------------------------- */

export function Tabs<T extends TabsValue>({
  className,
  onValueChange,
  ...props
}: TabsRootProps<T>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
      onValueChange={(value) => {
        if (value == null) return;
        onValueChange?.(value as T);
      }}
    />
  );
}

/* ---------------------- TabsList ------------------------- */

type ActiveRect = { left: number; width: number } | undefined;

const readActiveRect = (container: HTMLElement | null): ActiveRect => {
  if (!container) return undefined;
  const active = container.querySelector<HTMLElement>('[data-slot="tabs-trigger"][data-active]');
  if (!active) return undefined;
  return { left: active.offsetLeft, width: active.offsetWidth };
};

const areActiveRectsEqual = (a: ActiveRect, b: ActiveRect) => {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.left === b.left && a.width === b.width;
};

export function TabsList({ className, size = "default", children, ...props }: TabsListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cachedRectRef = useRef<ActiveRect>(undefined);
  const resolvedSize: TabsSize = size ?? "default";
  const sizeContextValue = useMemo(() => ({ size: resolvedSize }), [resolvedSize]);

  const subscribe = useCallback((onChange: () => void) => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return () => {};

    const handle = () => {
      cachedRectRef.current = undefined;
      onChange();
    };

    const mutationObserver = new MutationObserver(handle);
    mutationObserver.observe(container, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-active"],
    });

    const resizeObserver = new ResizeObserver(handle);
    resizeObserver.observe(container);
    const active = container.querySelector('[data-slot="tabs-trigger"][data-active]');
    if (active) resizeObserver.observe(active);

    window.addEventListener("resize", handle);

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", handle);
    };
  }, []);

  const getSnapshot = useCallback((): ActiveRect => {
    const next = readActiveRect(containerRef.current);
    const cached = cachedRectRef.current;
    if (areActiveRectsEqual(cached, next)) return cached;
    cachedRectRef.current = next;
    return next;
  }, []);

  const getServerSnapshot = useCallback((): ActiveRect => undefined, []);

  const activeRect = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const indicatorStyle = useMemo(() => {
    if (!activeRect) return { display: "none" };

    const inset = 2;
    const width = Math.max(0, activeRect.width - inset * 2);
    return {
      left: `${activeRect.left + inset}px`,
      width: `${width}px`,
    };
  }, [activeRect]);

  return (
    <TabsPrimitive.List
      ref={containerRef}
      data-slot="tabs-list"
      data-size={resolvedSize}
      className={cn(tabsListVariants({ size: resolvedSize, className }))}
      {...props}
    >
      <div style={indicatorStyle} className={tabsListIndicatorVariants({ size: resolvedSize })} />
      <TabsSizeContext value={sizeContextValue}>{children}</TabsSizeContext>
    </TabsPrimitive.List>
  );
}

/* -------------------- TabsTrigger ------------------------ */

export function TabsTrigger<T extends TabsValue>({
  className,
  size,
  ...props
}: TabsTriggerProps<T>) {
  const { size: inheritedSize } = use(TabsSizeContext);
  const resolvedSize: TabsSize = size ?? inheritedSize;

  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      data-size={resolvedSize}
      className={cn(tabsTriggerVariants({ size: resolvedSize, className }))}
      {...props}
    />
  );
}

/* -------------------- TabsContent ------------------------ */

export function TabsContent<T extends TabsValue>({ className, ...props }: TabsContentProps<T>) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

/* ------------------ Underline variants ------------------- */

export function TabsListUnderline({
  className,
  size = "default",
  children,
  ...props
}: TabsListUnderlineProps) {
  const resolvedSize: TabsSize = size ?? "default";
  const sizeContextValue = useMemo(() => ({ size: resolvedSize }), [resolvedSize]);

  return (
    <TabsPrimitive.List
      data-slot="tabs-list-underline"
      data-size={resolvedSize}
      className={cn(tabsListUnderlineVariants({ size: resolvedSize, className }))}
      {...props}
    >
      <TabsSizeContext value={sizeContextValue}>{children}</TabsSizeContext>
    </TabsPrimitive.List>
  );
}

export function TabsTriggerUnderline<T extends TabsValue>({
  className,
  size,
  ...props
}: TabsTriggerProps<T>) {
  const { size: inheritedSize } = use(TabsSizeContext);
  const resolvedSize: TabsSize = size ?? inheritedSize;

  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      data-size={resolvedSize}
      className={cn(tabsTriggerUnderlineVariants({ size: resolvedSize, className }))}
      {...props}
    />
  );
}
