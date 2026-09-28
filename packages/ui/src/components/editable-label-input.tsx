import { onEditFieldKeyDown } from "./editable-label.helpers";
import type { KeyboardEvent, RefCallback } from "react";

type EditableLabelInputProps = {
  multiline: boolean;
  editValue: string;
  displayLines: number;
  maxLength?: number;
  disabled: boolean;
  saving: boolean;
  inputClassName: string;
  placeholder: string;
  submitOnEnter: boolean;
  bindInputRef: RefCallback<HTMLInputElement | HTMLTextAreaElement>;
  onDraftChange: (next: string) => void;
  onBlurFinish: () => void;
  onCancel: () => void;
  onFinish: () => void;
};

export function EditableLabelInput({
  multiline,
  editValue,
  displayLines,
  maxLength,
  disabled,
  saving,
  inputClassName,
  placeholder,
  submitOnEnter,
  bindInputRef,
  onDraftChange,
  onBlurFinish,
  onCancel,
  onFinish,
}: EditableLabelInputProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onEditFieldKeyDown(e, { multiline, submitOnEnter, cancel: onCancel, finish: onFinish });
  };
  const shared = {
    ref: bindInputRef,
    value: editValue,
    onChange: (e: { currentTarget: { value: string } }) => onDraftChange(e.currentTarget.value),
    onBlur: onBlurFinish,
    onKeyDown,
    onDoubleClick: (e: { stopPropagation: () => void }) => e.stopPropagation(),
    disabled: disabled || saving,
    maxLength,
    className: inputClassName,
    placeholder,
    "aria-label": placeholder,
  };

  if (multiline) {
    return <textarea {...shared} rows={Math.max(1, displayLines)} />;
  }
  return <input {...shared} />;
}
