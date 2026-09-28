import { useMemo } from "react";
import { cn, mergeRefs } from "@monrep/utils";
import { EditableLabelInput } from "./editable-label-input";
import { LabelPreview } from "./editable-label-preview";
import {
  buildInputClassName,
  deriveLabelDisplay,
  underlineSizeMap,
} from "./editable-label.helpers";
import { useEditableLabel } from "./editable-label.hooks";
import type { Ref } from "react";
import type { EditableLabelSize } from "./editable-label.helpers";

export type EditableLabelProps = {
  ref?: Ref<HTMLDivElement>;
  value: string;
  displayValue?: string;
  onSave: (next: string) => void | Promise<void>;
  underline?: boolean;
  placeholder?: string;
  inputPlaceholder?: string;
  size?: EditableLabelSize;
  maxLength?: number;
  autoSelect?: boolean;
  align?: "left" | "center" | "right";
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  autoFocus?: boolean;
  multiline?: boolean;
  maxLines?: number;
  submitOnEnter?: boolean;
};

export const EditableLabel = ({
  ref,
  value,
  displayValue,
  onSave,
  underline = false,
  placeholder = "Untitled",
  inputPlaceholder,
  size = "lg",
  maxLength,
  autoSelect = true,
  align = "left",
  disabled = false,
  readOnly = false,
  className,
  autoFocus = false,
  multiline = false,
  maxLines = 1,
  submitOnEnter = true,
}: EditableLabelProps) => {
  const {
    canEdit,
    editing,
    editValue,
    saving,
    cancel,
    finish,
    bindInputRef,
    rootRef,
    rootInteractionProps,
    setDraft,
  } = useEditableLabel({ value, onSave, autoSelect, autoFocus, disabled, readOnly });

  const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref, rootRef]);

  const derived = deriveLabelDisplay({
    value,
    displayValue,
    editing,
    align,
    size,
    maxLines,
    multiline,
  });
  const inputPlaceholderResolved = inputPlaceholder ?? placeholder;
  const inputClassName = buildInputClassName(derived.padX, multiline, derived.labelType);

  return (
    <div
      ref={mergedRef}
      className={cn(
        "group relative w-full min-w-0 rounded transition-colors",
        readOnly
          ? "border-0 bg-transparent"
          : cn("border border-transparent", !disabled && "hover:bg-accent/40"),
        canEdit ? "cursor-text" : "cursor-default",
        className,
      )}
      {...rootInteractionProps}
    >
      <LabelPreview
        lines={derived.previewLines}
        editing={editing}
        value={value}
        previewText={derived.previewText}
        placeholder={placeholder}
        labelType={derived.labelType}
        padX={derived.padX}
        multiline={multiline}
        displayLines={derived.displayLines}
        usesPreview={derived.usesPreview}
      />

      {underline && canEdit && !editing && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute right-2 left-2",
            "origin-left scale-x-0 bg-foreground/50",
            "transition-transform duration-200 ease-out",
            "group-hover:scale-x-100",
            underlineSizeMap[size],
          )}
        />
      )}

      {editing && (
        <EditableLabelInput
          multiline={multiline}
          editValue={editValue}
          displayLines={derived.displayLines}
          maxLength={maxLength}
          disabled={disabled}
          saving={saving}
          inputClassName={inputClassName}
          placeholder={inputPlaceholderResolved}
          submitOnEnter={submitOnEnter}
          bindInputRef={bindInputRef}
          onDraftChange={setDraft}
          onBlurFinish={finish}
          onCancel={cancel}
          onFinish={finish}
        />
      )}
    </div>
  );
};
