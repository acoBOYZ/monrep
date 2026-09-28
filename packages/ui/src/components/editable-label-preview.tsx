import { cn } from "@monrep/utils";

type LabelPreviewProps = {
  lines: Array<string> | null;
  editing: boolean;
  value: string;
  previewText: string;
  placeholder: string;
  labelType: string;
  padX: string;
  multiline: boolean;
  displayLines: number;
  usesPreview: boolean;
};

export function LabelPreview({
  lines,
  editing,
  value,
  previewText,
  placeholder,
  labelType,
  padX,
  multiline,
  displayLines,
  usesPreview,
}: LabelPreviewProps) {
  if (lines && !editing) {
    return (
      <div
        className={cn("flex w-full min-w-0 flex-col items-center gap-0 overflow-hidden py-1", padX)}
      >
        {lines.map((line, lineIndex) => (
          <span
            key={lineIndex === 0 ? "preview-line-1" : "preview-line-2"}
            className={cn(
              "block w-full min-w-0",
              labelType,
              line ? "text-foreground" : "text-muted-foreground/60",
            )}
          >
            {line || placeholder}
          </span>
        ))}
      </div>
    );
  }

  const text = editing ? value || placeholder : previewText || placeholder;

  return (
    <div
      className={cn(
        "w-full min-w-0 py-1",
        padX,
        labelType,
        !usesPreview && "truncate",
        text ? "text-foreground" : "text-muted-foreground/60",
        usesPreview && "overflow-hidden wrap-break-word whitespace-pre-line",
        !usesPreview && multiline && "overflow-hidden wrap-break-word whitespace-pre-wrap",
        editing && "pointer-events-none opacity-0",
      )}
      style={
        !usesPreview && displayLines > 1
          ? {
              WebkitLineClamp: displayLines,
              WebkitBoxOrient: "vertical",
              display: "-webkit-box",
            }
          : undefined
      }
    >
      {text}
    </div>
  );
}
