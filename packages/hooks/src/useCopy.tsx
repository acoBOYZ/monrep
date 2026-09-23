import { useCallback } from "react";
import { useAsyncThrottler } from "@tanstack/react-pacer";

export const useCopy = (timeout = 666) => {
  const copyThrottler = useAsyncThrottler(
    async (text: string) => {
      await Promise.all([
        navigator.clipboard.writeText(text),
        new Promise<void>((resolve) => {
          setTimeout(resolve, timeout);
        }),
      ]);
    },
    {
      wait: timeout,
      leading: true,
      trailing: true,
    },
    (state) => ({
      isPending: state.isPending,
      isExecuting: state.isExecuting,
    }),
  );

  const handleCopy = useCallback(
    (text: string) => {
      void copyThrottler.maybeExecute(text);
    },
    [copyThrottler],
  );

  return {
    isPending: copyThrottler.state.isPending || copyThrottler.state.isExecuting,
    handleCopy,
  };
};
