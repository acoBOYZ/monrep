import { useEffect } from "react";
import type { RefObject } from "react";

type UseTerminalBodyInteractionsArgs = {
  wrapperRef: RefObject<HTMLDivElement | null>;
  bodyRef: RefObject<HTMLDivElement | null>;
  hiddenInputRef: RefObject<HTMLInputElement | null>;
  onInput: ((value: string) => void) | undefined;
  handleCopy: (text: string) => void;
};

/** Click-to-focus the hidden input and copy selected body text. */
export function useTerminalBodyInteractions({
  wrapperRef,
  bodyRef,
  hiddenInputRef,
  onInput,
  handleCopy,
}: UseTerminalBodyInteractionsArgs) {
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (wrapper == null || onInput == null) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("button, [role='tab'], [role='tablist']")
      ) {
        return;
      }
      hiddenInputRef.current?.focus();
    };
    wrapper.addEventListener("click", handleClick);
    return () => wrapper.removeEventListener("click", handleClick);
  }, [wrapperRef, hiddenInputRef, onInput]);

  useEffect(() => {
    const body = bodyRef.current;
    if (body == null) return;

    const copySelection = () => {
      const selection = window.getSelection();
      if (selection == null || selection.isCollapsed || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      if (!body.contains(range.commonAncestorContainer)) return;
      const text = selection.toString();
      if (text.trim().length === 0) return;
      handleCopy(text);
    };

    body.addEventListener("mouseup", copySelection);
    body.addEventListener("keyup", copySelection);
    return () => {
      body.removeEventListener("mouseup", copySelection);
      body.removeEventListener("keyup", copySelection);
    };
  }, [bodyRef, handleCopy]);
}
