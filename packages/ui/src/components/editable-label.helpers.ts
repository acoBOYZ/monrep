import { cn } from "@monrep/utils";
import type { KeyboardEvent } from "react";

export type EditableLabelSize = "xxs" | "xs" | "sm" | "base" | "lg" | "xl" | "2xl";

const sizeMap: Record<EditableLabelSize, string> = {
  xxs: "text-[11px] leading-4",
  xs: "text-xs leading-4",
  sm: "text-sm leading-5",
  base: "text-base leading-6",
  lg: "text-lg leading-7 font-semibold",
  xl: "text-xl leading-7 font-semibold",
  "2xl": "text-2xl leading-8 font-semibold",
};

export const underlineSizeMap: Record<EditableLabelSize, string> = {
  xxs: "bottom-px h-px",
  xs: "bottom-1 h-px",
  sm: "bottom-1 h-px",
  base: "bottom-1 h-px",
  lg: "bottom-0.5 h-[2px]",
  xl: "bottom-0.5 h-[2px]",
  "2xl": "bottom-0.5 h-[2px]",
};

export const stopPointerBubble = (event: { stopPropagation: () => void }) => {
  event.stopPropagation();
};

function alignmentClass(align: "left" | "center" | "right") {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

export type LabelDerived = {
  displayLines: number;
  usesPreview: boolean;
  previewText: string;
  previewLines: Array<string> | null;
  labelType: string;
  padX: string;
};

export function deriveLabelDisplay(args: {
  value: string;
  displayValue?: string;
  editing: boolean;
  align: "left" | "center" | "right";
  size: EditableLabelSize;
  maxLines: number;
  multiline: boolean;
}): LabelDerived {
  const { value, displayValue, editing, align, size, maxLines, multiline } = args;
  const usesPreview = displayValue != null;
  const previewText = displayValue ?? value;
  const previewLines =
    usesPreview && !editing && displayValue.includes("\n")
      ? displayValue.split("\n").slice(0, 2)
      : null;
  const displayLines = maxLines || (multiline ? 2 : 1);
  const labelType = cn(sizeMap[size], alignmentClass(align));
  const padX = usesPreview ? "px-0" : "px-2";
  return { displayLines, usesPreview, previewText, previewLines, labelType, padX };
}

export function buildInputClassName(padX: string, multiline: boolean, labelType: string) {
  return cn(
    "absolute inset-0 w-full min-w-0 border-0 bg-transparent py-1 outline-none",
    padX,
    multiline ? "resize-none overflow-hidden wrap-break-word whitespace-pre-wrap" : "truncate",
    labelType,
    "placeholder:text-foreground/60",
  );
}

type EditKeyDownOpts = {
  multiline: boolean;
  submitOnEnter: boolean;
  cancel: () => void;
  finish: () => void;
};

export function onEditFieldKeyDown(
  e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  opts: EditKeyDownOpts,
) {
  const { multiline, submitOnEnter, cancel, finish } = opts;
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    cancel();
    return;
  }
  if (e.key === " " || e.key === "Spacebar") e.stopPropagation();
  if (e.key !== "Enter") return;
  e.stopPropagation();
  if ((e.metaKey || e.ctrlKey) && !submitOnEnter) {
    e.preventDefault();
    finish();
    return;
  }
  if (multiline && e.shiftKey) return;
  if (!submitOnEnter) return;
  e.preventDefault();
  finish();
}
