import { useCallback, useMemo, useState } from "react";

export function useDisclosure({
  defaultIsOpen = false,
}: {
  defaultIsOpen?: boolean;
} = {}) {
  const [isOpen, setIsOpen] = useState(defaultIsOpen);

  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);
  const onToggle = useCallback(() => setIsOpen((currentValue) => !currentValue), []);

  return useMemo(
    () => ({
      onOpen,
      onClose,
      isOpen,
      onToggle,
    }),
    [isOpen, onOpen, onClose, onToggle],
  );
}
