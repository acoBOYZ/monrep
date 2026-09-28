import { useCallback, useEffect, useRef, useState } from "react";
import { useSessionRun } from "./useSessionRun";

type ParseResult<T> = {
  items: Array<T>;
  parseError: string | null;
};

type RefreshOptions = {
  selectedKey?: string | null;
  onSelectedGone?: () => void;
  isSelected?: (item: unknown, key: string) => boolean;
};

type UseOpsListParams<T> = {
  serverId: string;
  online: boolean;
  listArgv: ReadonlyArray<string>;
  parse: (lines: Array<string>) => ParseResult<T>;
};

export function useOpsList<T>({ serverId, online, listArgv, parse }: UseOpsListParams<T>) {
  const { error, busy, runAsync, cancel } = useSessionRun(serverId);
  const [items, setItems] = useState<Array<T>>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const bootRef = useRef(false);

  const applyLines = useCallback(
    (lines: Array<string>, options?: RefreshOptions) => {
      const { items: next, parseError } = parse(lines);
      setItems(next);
      setListError(parseError);
      if (!options) return;
      const { selectedKey: key, onSelectedGone, isSelected } = options;
      if (key && onSelectedGone && isSelected) {
        if (!next.some((item) => isSelected(item, key))) {
          onSelectedGone();
        }
      }
    },
    [parse],
  );

  useEffect(() => {
    if (!online || bootRef.current) return;
    bootRef.current = true;
    void runAsync([...listArgv])
      .then((lines) => applyLines(lines))
      .catch(() => {
        /* error in hook state */
      });
  }, [online, runAsync, applyLines, listArgv]);

  const refresh = useCallback(
    (options?: RefreshOptions) => {
      if (!online || busy) return;
      setLoading(true);
      void runAsync([...listArgv])
        .then((lines) => applyLines(lines, options))
        .catch(() => {
          /* error in hook state */
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [online, busy, runAsync, applyLines, listArgv],
  );

  return { items, listError, loading, busy, error, refresh, runAsync, cancel };
}
