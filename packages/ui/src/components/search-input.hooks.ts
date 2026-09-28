import { useState } from "react";
import { useDebouncer } from "@tanstack/react-pacer";

export const useSearchDraft = (
  value: string | null | undefined,
  defaultValue: string,
  onValueChange: ((next: string) => void) | undefined,
  onDebouncedValueChange: ((next: string) => void) | undefined,
  debounce: number,
) => {
  const [draft, setDraft] = useState(() => String(value ?? defaultValue));
  const [seen, setSeen] = useState(value);
  if (value !== undefined && !Object.is(value, seen)) {
    setSeen(value);
    setDraft(value ?? "");
  }

  const delay = debounce > 0 ? onDebouncedValueChange : undefined;
  const debounced = useDebouncer((next: string) => delay?.(next), {
    wait: debounce,
    enabled: Boolean(delay),
  });

  const commit = (next: string, flush = false) => {
    setDraft(next);
    onValueChange?.(next);
    if (!delay) return;
    if (flush) {
      debounced.cancel();
      delay(next);
      return;
    }
    debounced.maybeExecute(next);
  };

  return { current: draft, commit };
};
