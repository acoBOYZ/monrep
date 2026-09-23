import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLazyRef } from "./useLazyRef";

interface UseParallelQueueOptions {
  concurrency?: number;
  autoStart?: boolean;
  onDrain?: () => void;
}

export function useParallelQueue<T>(
  handler: (task: T) => Promise<void> | void,
  options: UseParallelQueueOptions = {},
) {
  const concurrency = options.concurrency ?? 5;
  const autoStart = options.autoStart ?? true;
  const onDrain = options.onDrain;
  const pendingRef = useRef<Array<T>>([]);
  const activeCountRef = useRef(0);
  const startedRef = useRef(autoStart);
  const handlerRef = useRef(handler);
  const onDrainRef = useRef(onDrain);
  const concurrencyRef = useLazyRef(() => Math.max(1, concurrency));

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    onDrainRef.current = onDrain;
  }, [onDrain]);

  useEffect(() => {
    concurrencyRef.current = Math.max(1, concurrency);
  }, [concurrency, concurrencyRef]);

  const run = useCallback(
    function runQueue() {
      const settleTask = () => {
        activeCountRef.current = Math.max(0, activeCountRef.current - 1);

        if (
          startedRef.current &&
          activeCountRef.current < concurrencyRef.current &&
          pendingRef.current.length > 0
        ) {
          runQueue();
        }

        if (pendingRef.current.length === 0 && activeCountRef.current === 0) {
          onDrainRef.current?.();
        }
      };

      while (
        startedRef.current &&
        activeCountRef.current < concurrencyRef.current &&
        pendingRef.current.length > 0
      ) {
        const task = pendingRef.current.shift();
        if (task === undefined) break;

        activeCountRef.current = activeCountRef.current + 1;

        void Promise.resolve()
          .then(() => handlerRef.current(task))
          .then(settleTask, (error) => {
            console.error("[useParallelQueue] Task handler failed:", error);
            settleTask();
          });
      }
    },
    [concurrencyRef],
  );

  const push = useCallback(
    (task: T) => {
      pendingRef.current.push(task);
      if (startedRef.current) run();
    },
    [run],
  );

  const start = useCallback(() => {
    startedRef.current = true;
    run();
  }, [run]);

  const stop = useCallback(() => {
    startedRef.current = false;
  }, []);

  const clear = useCallback(() => {
    pendingRef.current = [];
  }, []);

  const abort = useCallback(() => {
    // In-flight cancellation is handler-specific (e.g. XHR abort).
    // Keep queue state untouched to mirror prior behavior.
  }, []);

  const idle = useCallback(
    () => pendingRef.current.length === 0 && activeCountRef.current === 0,
    [],
  );

  const length = useCallback(() => pendingRef.current.length, []);

  return useMemo(
    () => ({
      push,
      start,
      stop,
      clear,
      abort,
      idle,
      length,
    }),
    [abort, clear, idle, length, push, start, stop],
  );
}
