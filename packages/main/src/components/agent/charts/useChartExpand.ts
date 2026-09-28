import { startTransition, useCallback, useState } from "react";

export function useChartExpand() {
  const [open, setOpen] = useState(false);

  const openDialog = useCallback(() => {
    startTransition(() => {
      setOpen(true);
    });
  }, []);

  const closeDialog = useCallback(() => {
    startTransition(() => {
      setOpen(false);
    });
  }, []);

  return { open, openDialog, closeDialog };
}
