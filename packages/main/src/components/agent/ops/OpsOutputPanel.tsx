import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { ArrowDown01Icon, TerminalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge, Button, CopyableButton, TooltipTrigger } from "@monrep/ui/base";
import { ImpactFlash, RowVirtualizer } from "@monrep/ui/func";
import { cn } from "@monrep/utils";
import type { RowVirtualizerScrollHandle } from "@monrep/ui/func";

type OpsOutputPanelProps = {
  title?: string;
  subtitle?: string;
  output: string;
  busy: boolean;
  className?: string;
};

const estimateSize = () => 20;

function outputLineContent(index: number, line: string) {
  return (
    <div className="group flex gap-3 rounded-sm px-2 hover:bg-muted/40">
      <span
        className="w-[3ch] shrink-0 text-end text-muted-foreground/50 tabular-nums select-none group-hover:text-muted-foreground"
        aria-hidden
      >
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 wrap-break-word whitespace-pre-wrap text-foreground">
        {line || " "}
      </span>
    </div>
  );
}

export function OpsOutputPanel({ title, subtitle, output, busy, className }: OpsOutputPanelProps) {
  const scrollControlRef = useRef<RowVirtualizerScrollHandle | null>(null);
  const [pinnedToEnd, setPinnedToEnd] = useState(true);
  const hasSelection = Boolean(title);
  const lines = useMemo(() => (output ? output.split("\n") : []), [output]);
  const isEmpty = hasSelection && !busy && lines.length === 0;

  const stickToEnd = useEffectEvent(() => {
    scrollControlRef.current?.scrollToEnd("instant");
  });

  useEffect(() => {
    if (!pinnedToEnd || lines.length === 0) return;
    stickToEnd();
  }, [lines.length, pinnedToEnd]);

  const handleJumpToLatest = () => {
    scrollControlRef.current?.scrollToEnd("smooth");
    setPinnedToEnd(true);
  };

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
              <ImpactFlash watch={lines.length}>
                <Badge variant="muted" className="tabular-nums">
                  {lines.length} lines
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

      {!hasSelection ? (
        <div className="flex h-full min-h-32 flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
            <HugeiconsIcon icon={TerminalIcon} className="size-5" aria-hidden />
          </span>
          <p className="text-sm font-medium">No output yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Select a unit, then run Logs or Status to stream output here.
          </p>
        </div>
      ) : isEmpty ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
            <HugeiconsIcon icon={TerminalIcon} className="size-5" aria-hidden />
          </span>
          <p className="text-sm font-medium">No output yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Output will appear here as soon as the command writes to stdout or stderr.
          </p>
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <RowVirtualizer
            className="min-h-0 flex-1 px-1 py-2 font-mono text-[11px] leading-relaxed"
            data={lines}
            estimateSize={estimateSize}
            overscan={12}
            getItemKey={(index) => index}
            scrollControlRef={scrollControlRef}
            onScrollToEnd={setPinnedToEnd}
            itemContent={outputLineContent}
          />
          {!pinnedToEnd && lines.length > 0 ? (
            <Button
              type="button"
              size="xs"
              variant="secondary"
              onClick={handleJumpToLatest}
              className="absolute bottom-3 left-1/2 rounded-full shadow-md"
            >
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5" aria-hidden />
              Jump to latest
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
