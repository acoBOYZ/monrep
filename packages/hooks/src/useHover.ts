import { useCallback, useMemo } from "react";
import { useDebouncer } from "@tanstack/react-pacer";

type AsyncOrSync = void | Promise<void>;

export function useHover<TArgs extends Array<unknown>>(
  onHoverCallback: (...args: TArgs) => AsyncOrSync,
  timeout = 150,
  disabled = false,
) {
  const debouncer = useDebouncer((...args: TArgs) => onHoverCallback(...args), {
    wait: timeout,
    enabled: !disabled,
  });

  const trigger = useCallback(
    (...args: TArgs) => {
      debouncer.maybeExecute(...args);
    },
    [debouncer],
  );

  const cancel = useCallback(() => {
    debouncer.cancel();
  }, [debouncer]);

  return useMemo(() => ({ trigger, cancel }) as const, [trigger, cancel]);
}
