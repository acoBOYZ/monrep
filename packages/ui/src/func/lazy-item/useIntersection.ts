import { useEffect, useRef } from "react";
import { benchObserve } from "./bench";
import type { RefObject } from "react";

type Options = Omit<IntersectionObserverInit, "root">;
type RootValue = Element | null | RefObject<Element | null> | (() => Element | null) | undefined;

type ElementEntry = {
  onEnter: () => void;
  onLeave?: () => void;
  persistent: boolean;
};

type ObserverEntry = {
  observer: IntersectionObserver;
  elements: Map<Element, ElementEntry>;
};

const observers = new Map<string, Map<Element | null, ObserverEntry>>();

function optionsKey(options: Options): string {
  const { rootMargin = "", threshold = 0 } = options;
  const thresholdKey = Array.isArray(threshold) ? threshold.join(",") : String(threshold);

  return `${rootMargin}|${thresholdKey}`;
}

function resolveRoot(rootValue: RootValue): Element | null {
  if (typeof rootValue === "function") {
    return rootValue();
  }

  if (rootValue && typeof rootValue === "object" && "current" in rootValue) {
    return rootValue.current ?? null;
  }

  return rootValue ?? null;
}

function isDeferredRootSource(rootValue: RootValue): boolean {
  if (!rootValue) return false;
  return (
    typeof rootValue === "function" || (typeof rootValue === "object" && "current" in rootValue)
  );
}

function getObserverEntry(key: string, root: Element | null, options: Options): ObserverEntry {
  let rootMap = observers.get(key);
  if (!rootMap) {
    rootMap = new Map();
    observers.set(key, rootMap);
  }

  const existing = rootMap.get(root);
  if (existing) return existing;

  const elements = new Map<Element, ElementEntry>();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = elements.get(entry.target);
        if (!el) return;

        if (entry.isIntersecting) {
          el.onEnter();
          if (!el.persistent) {
            observer.unobserve(entry.target);
            elements.delete(entry.target);
          }
        } else if (el.persistent) {
          el.onLeave?.();
        }
      });
    },
    {
      root,
      rootMargin: options.rootMargin,
      threshold: options.threshold,
    },
  );

  const entry = { observer, elements };
  rootMap.set(root, entry);

  return entry;
}

function detachFromObserver(
  key: string,
  root: Element | null,
  el: Element,
  observer: IntersectionObserver,
  elements: Map<Element, ElementEntry>,
) {
  elements.delete(el);
  observer.unobserve(el);

  if (elements.size === 0) {
    observer.disconnect();
    const rootMap = observers.get(key);
    rootMap?.delete(root);
    if (rootMap?.size === 0) observers.delete(key);
  }
}

function attachTwoPhaseObserver(args: {
  el: Element;
  root: Element | null;
  entryKey: string;
  exitKey: string;
  options: Options;
  exitOptions: Options;
  disposed: () => boolean;
  onVisible: () => void;
  onHidden: () => void;
  setCleanup: (cleanup: () => void) => void;
}): () => void {
  const {
    el,
    root,
    entryKey,
    exitKey,
    options,
    exitOptions,
    disposed,
    onVisible,
    onHidden,
    setCleanup,
  } = args;

  const attachExit = () => {
    const { observer, elements } = getObserverEntry(exitKey, root, exitOptions);
    let hasEnteredExit = false;

    elements.set(el, {
      onEnter: () => {
        hasEnteredExit = true;
      },
      onLeave: () => {
        if (!hasEnteredExit || disposed()) return;
        onHidden();
        detachFromObserver(exitKey, root, el, observer, elements);
        setCleanup(attachEntry());
      },
      persistent: true,
    });
    observer.observe(el);

    return () => detachFromObserver(exitKey, root, el, observer, elements);
  };

  const attachEntry = () => {
    const { observer, elements } = getObserverEntry(entryKey, root, options);

    elements.set(el, {
      onEnter: () => {
        if (disposed()) return;
        onVisible();
        detachFromObserver(entryKey, root, el, observer, elements);
        setCleanup(attachExit());
      },
      persistent: false,
    });
    observer.observe(el);

    return () => detachFromObserver(entryKey, root, el, observer, elements);
  };

  return attachEntry();
}

function attachSingleObserver(
  el: Element,
  root: Element | null,
  entryKey: string,
  options: Options,
  observerKey: string | undefined,
  onVisible: () => void,
  onHidden?: () => void,
): () => void {
  benchObserve(observerKey, root === null);
  const { observer, elements } = getObserverEntry(entryKey, root, options);

  elements.set(el, { onEnter: onVisible, onLeave: onHidden, persistent: !!onHidden });
  observer.observe(el);

  return () => {
    elements.delete(el);
    observer.unobserve(el);

    if (elements.size === 0) {
      observer.disconnect();
      const rootMap = observers.get(entryKey);
      rootMap?.delete(root);
      if (rootMap?.size === 0) observers.delete(entryKey);
    }
  };
}

export function useIntersection<T extends Element = HTMLDivElement>(
  onVisible: () => void,
  options: Options,
  rootValue?: RootValue,
  observerKey?: string,
  onHidden?: () => void,
  exitOptions?: Options,
) {
  const ref = useRef<T | null>(null);
  const entryKey = observerKey ? `${observerKey}|${optionsKey(options)}` : optionsKey(options);
  const exitKey = exitOptions
    ? observerKey
      ? `${observerKey}|exit|${optionsKey(exitOptions)}`
      : `exit|${optionsKey(exitOptions)}`
    : null;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let rafId: number | null = null;
    let attempts = 0;
    let currentCleanup: (() => void) | null = null;
    let disposed = false;

    const waitForRoot = isDeferredRootSource(rootValue);
    const tryAttach = () => {
      if (disposed) return;

      const root = resolveRoot(rootValue);
      if (waitForRoot && root === null && attempts < 20) {
        attempts += 1;
        rafId = requestAnimationFrame(tryAttach);
        return;
      }

      if (onHidden && exitOptions && exitKey) {
        currentCleanup = attachTwoPhaseObserver({
          el,
          root,
          entryKey,
          exitKey,
          options,
          exitOptions,
          disposed: () => disposed,
          onVisible,
          onHidden,
          setCleanup: (cleanup) => {
            currentCleanup = cleanup;
          },
        });
      } else {
        currentCleanup = attachSingleObserver(
          el,
          root,
          entryKey,
          options,
          observerKey,
          onVisible,
          onHidden,
        );
      }
    };

    tryAttach();

    return () => {
      disposed = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      currentCleanup?.();
    };
  }, [entryKey, exitKey, onVisible, options, rootValue, observerKey, onHidden, exitOptions]);

  return ref;
}
