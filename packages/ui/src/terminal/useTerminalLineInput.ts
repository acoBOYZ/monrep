import { useRef, useState } from "react";
import { useLocalStorage } from "@monrep/hooks";
import type { ChangeEvent, KeyboardEvent } from "react";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

let measureCanvas: HTMLCanvasElement | null = null;

const measureCharsWidth = (inputElement: HTMLInputElement, chars: string): number => {
  const computedStyle = window.getComputedStyle(inputElement);
  measureCanvas ??= document.createElement("canvas");
  const context = measureCanvas.getContext("2d");
  if (!context) return 0;
  context.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
  return -context.measureText(chars).width;
};

type UseTerminalLineInputArgs = {
  historyKey: string;
  startingInputValue: string;
  onInput?: ((input: string) => void) | null;
  onAfterSubmit?: () => void;
};

export const useTerminalLineInput = ({
  historyKey,
  startingInputValue,
  onInput,
  onAfterSubmit,
}: UseTerminalLineInputArgs) => {
  const [history, setHistory] = useLocalStorage<Array<string>>(historyKey, []);
  const historyIndexRef = useRef(-1);
  const tmpInputValueRef = useRef("");
  const [currentLineInput, setCurrentLineInput] = useState(() => startingInputValue.trim());
  const [cursorPos, setCursorPos] = useState(0);

  const resetEphemeralInput = () => {
    historyIndexRef.current = -1;
    tmpInputValueRef.current = "";
    setCurrentLineInput("");
    setCursorPos(0);
  };

  const navigateHistory = (direction: 1 | -1) => {
    if (history.length === 0) {
      historyIndexRef.current = -1;
      return;
    }

    const historyIndex = historyIndexRef.current;

    if (historyIndex === -1 && direction === -1) {
      tmpInputValueRef.current = currentLineInput;
      const nextIndex = history.length - 1;
      historyIndexRef.current = nextIndex;
      setCurrentLineInput(history[nextIndex] ?? "");
      return;
    }

    if (historyIndex === history.length - 1 && direction === 1) {
      historyIndexRef.current = -1;
      setCurrentLineInput(tmpInputValueRef.current);
      tmpInputValueRef.current = "";
      return;
    }

    if (historyIndex === -1 && direction === 1) return;

    const nextIndex = clamp(historyIndex + direction, 0, history.length - 1);
    historyIndexRef.current = nextIndex;
    setCurrentLineInput(history[nextIndex] ?? "");
  };

  const handleLineInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const next = input.value;
    const start = input.selectionStart ?? next.length;
    const end = input.selectionEnd ?? next.length;
    setCurrentLineInput(next);
    const charsToRight = next.slice(start);
    setCursorPos(measureCharsWidth(input, charsToRight));
    // Safari leaves the caret stuck after controlled re-renders; restore it.
    requestAnimationFrame(() => {
      if (document.activeElement !== input) return;
      try {
        input.setSelectionRange(start, end);
      } catch {
        // ignored — password / detached inputs can throw
      }
    });
  };

  const handleLineKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!onInput) return;

    if (event.key === "Enter") {
      event.preventDefault();
      onInput(currentLineInput);
      setCursorPos(0);

      const trimmedInput = currentLineInput.trim();
      if (trimmedInput !== "") {
        setHistory((previousHistory) =>
          previousHistory[previousHistory.length - 1] === trimmedInput
            ? previousHistory
            : [...previousHistory, trimmedInput],
        );
      }

      historyIndexRef.current = -1;
      setCurrentLineInput("");
      tmpInputValueRef.current = "";
      onAfterSubmit?.();
      return;
    }

    if (!["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Delete"].includes(event.key)) {
      return;
    }

    const inputElement = event.currentTarget;
    let charsToRightOfCursor = "";
    let cursorIndex = currentLineInput.length - (inputElement.selectionStart || 0);
    cursorIndex = clamp(cursorIndex, 0, currentLineInput.length);

    if (event.key === "ArrowLeft") {
      if (cursorIndex > currentLineInput.length - 1) cursorIndex--;
      charsToRightOfCursor = currentLineInput.slice(currentLineInput.length - 1 - cursorIndex);
    } else if (event.key === "ArrowRight" || event.key === "Delete") {
      charsToRightOfCursor = currentLineInput.slice(currentLineInput.length - cursorIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      charsToRightOfCursor = "";
      navigateHistory(-1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      charsToRightOfCursor = "";
      navigateHistory(1);
    }

    setCursorPos(measureCharsWidth(inputElement, charsToRightOfCursor));
  };

  return {
    currentLineInput,
    cursorPos,
    resetEphemeralInput,
    handleLineInputChange,
    handleLineKeyDown,
  };
};
