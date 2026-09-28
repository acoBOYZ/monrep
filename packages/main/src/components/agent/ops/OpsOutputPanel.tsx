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
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/60 bg-card/40",
        className,
      )}
    >
      <div className="relative shrink-0 border-b border-border/60 px-3 py-2">
        {busy ? (
          <div className="absolute inset-x-0 bottom-0 h-0.5 animate-pulse bg-primary" />
        ) : null}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {hasSelection ? (
              <>
                <p className="truncate text-sm font-semibold">{title}</p>
                {subtitle ? (
                  <p className="truncate font-mono text-xs text-muted-foreground">{subtitle}</p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Output</p>
            )}
          </div>
          {hasSelection ? (
            <div className="flex shrink-0 items-center gap-2">
              <TooltipTrigger content="Copy output">
                <CopyableButton variant="icon" text={output} disabled={!output} />
              </TooltipTrigger>
              <Badge variant="muted">{lines} lines</Badge>
            </div>
          ) : null}
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {hasSelection ? (
          <ImpactFlash watch={output}>
            <pre className="p-3 font-mono text-[11px] leading-relaxed wrap-break-word whitespace-pre-wrap">
              {output || "—"}
            </pre>
          </ImpactFlash>
        ) : (
          <div className="flex h-full min-h-32 items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">Select a row, then Logs / Status.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
