import { useCallback, useState } from "react";

export function useOpsSelection(
  online: boolean,
  busy: boolean,
  runAsync: (argv: Array<string>) => Promise<Array<string>>,
) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [output, setOutput] = useState("");

  const select = useCallback((key: string) => {
    setSelectedKey(key);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedKey(null);
  }, []);

  const runAndShow = useCallback(
    (argv: Array<string>, key: string) => {
      if (!online || busy) return;
      setSelectedKey(key);
      void runAsync(argv)
        .then((lines) => setOutput(lines.join("\n")))
        .catch(() => {
          /* error in hook state */
        });
    },
    [online, busy, runAsync],
  );

  const runVerb = useCallback(
    (argv: Array<string>, key: string, onDone?: () => void) => {
      if (!online || busy) return;
      setSelectedKey(key);
      void runAsync(argv)
        .then((lines) => {
          setOutput(lines.join("\n") || "done");
          onDone?.();
        })
        .catch(() => {
          /* error in hook state */
        });
    },
    [online, busy, runAsync],
  );

  return {
    selectedKey,
    select,
    clearSelection,
    output,
    setOutput,
    runAndShow,
    runVerb,
  };
}
