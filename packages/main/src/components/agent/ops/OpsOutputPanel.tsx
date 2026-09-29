import { TerminalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge, CopyableButton, ScrollArea, TooltipTrigger } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { cn } from "@monrep/utils";

type OpsOutputPanelProps = {
  title?: string;
  subtitle?: string;
  output: string;
  busy: boolean;
  className?: string;
};

function lineCount(text: string): number {
  if (!text) return 0;
  return text.split("\n").length;
}

export function OpsOutputPanel({ title, subtitle, output, busy, className }: OpsOutputPanelProps) {
  const lines = lineCount(output);
  const hasSelection = Boolean(title);

  return (
    <section
      aria-busy={busy}
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border/60 bg-card/40",
        className,
      )}
    >
      <div className="relative shrink-0 border-b border-border/60 px-3 py-2">
        {busy ? (
          <div
            className="absolute inset-x-0 bottom-0 h-0.5 animate-pulse bg-primary motion-reduce:animate-none"
            aria-hidden
          />
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
              <HugeiconsIcon icon={TerminalIcon} className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{hasSelection ? title : "Output"}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {hasSelection
                  ? (subtitle ?? "journal / systemctl")
                  : "Select a row, then Logs / Status"}
              </p>
            </div>
          </div>
          {hasSelection ? (
            <div
              role="toolbar"
              aria-label="Output options"
              className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none"
            >
              <ImpactFlash watch={lines}>
                <Badge variant="muted" className="tabular-nums">
                  {lines} lines
                </Badge>
              </ImpactFlash>
              <TooltipTrigger content="Copy output">
                <CopyableButton
                  variant="icon"
                  text={output}
                  disabled={!output}
                  className="static size-8 rounded-md border border-border hover:bg-muted/50"
                />
              </TooltipTrigger>
            </div>
          ) : null}
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1 overflow-y-auto">
        {hasSelection ? (
          <ImpactFlash watch={output}>
            <pre className="p-3 font-mono text-[11px] leading-relaxed wrap-break-word whitespace-pre-wrap">
              {output || "—"}
            </pre>
          </ImpactFlash>
        ) : (
          <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 p-8 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
              <HugeiconsIcon icon={TerminalIcon} className="size-5" aria-hidden />
            </span>
            <p className="text-sm font-medium">No output yet</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Select a unit, then run Logs or Status to stream output here.
            </p>
          </div>
        )}
      </ScrollArea>
    </section>
  );
}
