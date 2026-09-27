type BenchGroup = {
  key: string;
  startedAt: number;
  mounted: number;
  observed: number;
  visible: number;
  visibleIn16ms: number;
  visibleIn100ms: number;
  visibleIn500ms: number;
  viewportRootObserves: number;
  timer: number | null;
};

declare global {
  interface Window {
    __LAZY_ITEM_BENCH__?: boolean;
    __LAZY_ITEM_BENCH_GROUPS__?: Record<string, BenchGroup>;
  }
}

function isEnabled() {
  if (typeof window === "undefined") return false;
  if (window.__LAZY_ITEM_BENCH__) return true;
  return window.location.search.includes("lazyBench=1");
}

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function getStore() {
  if (typeof window === "undefined") return null;
  if (!window.__LAZY_ITEM_BENCH_GROUPS__) {
    window.__LAZY_ITEM_BENCH_GROUPS__ = {};
  }
  return window.__LAZY_ITEM_BENCH_GROUPS__;
}

function resolveKey(rawKey?: string) {
  return rawKey?.trim() || "default";
}

function getGroup(rawKey?: string) {
  if (!isEnabled()) return null;
  const store = getStore();
  if (!store) return null;

  const key = resolveKey(rawKey);
  if (!store[key]) {
    store[key] = {
      key,
      startedAt: now(),
      mounted: 0,
      observed: 0,
      visible: 0,
      visibleIn16ms: 0,
      visibleIn100ms: 0,
      visibleIn500ms: 0,
      viewportRootObserves: 0,
      timer: null,
    };
  }

  return store[key];
}

function scheduleReport(group: BenchGroup) {
  if (typeof window === "undefined") return;
  if (group.timer) return;

  group.timer = window.setTimeout(() => {
    const elapsedMs = Math.round(now() - group.startedAt);
    const hidden = Math.max(group.mounted - group.visible, 0);

    console.groupCollapsed(`[LazyItemBench] ${group.key}`);
    console.table({
      elapsedMs,
      mounted: group.mounted,
      observed: group.observed,
      visible: group.visible,
      hidden,
      visibleIn16ms: group.visibleIn16ms,
      visibleIn100ms: group.visibleIn100ms,
      visibleIn500ms: group.visibleIn500ms,
      viewportRootObserves: group.viewportRootObserves,
    });
    console.groupEnd();

    group.timer = null;
  }, 1200);
}

export function benchMount(rawKey?: string) {
  const group = getGroup(rawKey);
  if (!group) return;

  group.mounted += 1;
  scheduleReport(group);
}

export function benchObserve(rawKey: string | undefined, hasViewportRoot: boolean) {
  const group = getGroup(rawKey);
  if (!group) return;

  group.observed += 1;
  if (hasViewportRoot) {
    group.viewportRootObserves += 1;
  }
  scheduleReport(group);
}

export function benchVisible(rawKey?: string) {
  const group = getGroup(rawKey);
  if (!group) return;

  group.visible += 1;
  const elapsed = now() - group.startedAt;
  if (elapsed <= 16) group.visibleIn16ms += 1;
  if (elapsed <= 100) group.visibleIn100ms += 1;
  if (elapsed <= 500) group.visibleIn500ms += 1;

  scheduleReport(group);
}
