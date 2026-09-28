import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { stopPointerBubble } from "./editable-label.helpers";
import type { KeyboardEvent } from "react";

export type UseEditableLabelArgs = {
  value: string;
  onSave: (next: string) => void | Promise<void>;
  autoSelect: boolean;
  autoFocus: boolean;
  disabled: boolean;
  readOnly: boolean;
};

export function useEditableLabel({
  value,
  onSave,
  autoSelect,
  autoFocus,
  disabled,
  readOnly,
}: UseEditableLabelArgs) {
  const canEdit = !disabled && !readOnly;
  const [editing, setEditing] = useState(autoFocus && canEdit);
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, startSaveTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const finishRef = useRef<() => void>(() => {});

  const editValue = draft ?? value;
  const isDirty = editValue !== value;

  const finish = useCallback(() => {
    if (saving) return;
    if (!isDirty) {
      setEditing(false);
      return;
    }
    startSaveTransition(async () => {
      await onSave(editValue);
      setEditing(false);
    });
  }, [editValue, isDirty, onSave, saving]);

  useEffect(() => {
    finishRef.current = () => {
      finish();
    };
  }, [finish]);

  useEffect(() => {
    if (!editing) return;
    const dismiss = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target)) return;
      finishRef.current();
    };
    document.addEventListener("pointerdown", dismiss, true);
    return () => document.removeEventListener("pointerdown", dismiss, true);
  }, [editing]);

  const cancel = useCallback(() => {
    setDraft(null);
    setEditing(false);
  }, []);

  const beginEdit = useCallback(() => {
    if (!canEdit || editing) return;
    setDraft(null);
    setEditing(true);
  }, [canEdit, editing]);

  const bindInputRef = useCallback(
    (element: HTMLInputElement | HTMLTextAreaElement | null) => {
      inputRef.current = element;
      if (!element) return;
      element.focus();
      if (autoSelect) element.select();
    },
    [autoSelect],
  );

  const handleRootClick = useCallback(() => {
    if (!editing) beginEdit();
  }, [beginEdit, editing]);

  const handleRootKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (editing) return;
      if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
      event.preventDefault();
      beginEdit();
    },
    [beginEdit, editing],
  );

  const rootInteractionProps = canEdit
    ? {
        role: "button" as const,
        tabIndex: editing ? -1 : 0,
        "aria-disabled": disabled,
        "aria-readonly": readOnly,
        onClick: handleRootClick,
        onKeyDown: handleRootKeyDown,
        onPointerDown: stopPointerBubble,
        onMouseDown: stopPointerBubble,
      }
    : { "aria-readonly": readOnly || undefined };

  return {
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
  };
}
