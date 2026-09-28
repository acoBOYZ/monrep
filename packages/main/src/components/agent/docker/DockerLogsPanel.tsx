import { useEffect, useEffectEvent, useRef, useState } from "react";
import { ArrowDown01Icon, TerminalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Badge,
  Button,
  CopyableButton,
  Tabs,
  TabsList,
  TabsTrigger,
  TooltipTrigger,
} from "@monrep/ui/base";
import { ImpactFlash, RowVirtualizer } from "@monrep/ui/func";
import { cn } from "@monrep/utils";
import { LOG_TAIL_OPTIONS } from "./useDockerContainerLogs";
import type { RowVirtualizerScrollHandle } from "@monrep/ui/func";
import type { LogTail } from "./useDockerContainerLogs";

type DockerLogsPanelProps = {
  title: string;
  subtitle: string;
  lines: ReadonlyArray<string>;
  busy: boolean;
  tail: LogTail;
  onTailChange: (tail: LogTail) => void;
  className?: string;
};

const estimateSize = () => 20;

function logLineContent(index: number, line: string) {
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

export function DockerLogsPanel({
  title,
  subtitle,
  lines,
  busy,
  tail,
  onTailChange,
  className,
}: DockerLogsPanelProps) {
  const scrollControlRef = useRef<RowVirtualizerScrollHandle | null>(null);
  const [pinnedToEnd, setPinnedToEnd] = useState(true);
  const data = lines as Array<string>;
  const copyText = lines.join("\n");
  const isEmpty = !busy && lines.length === 0;

  const stickToEnd = useEffectEvent(() => {
    scrollControlRef.current?.scrollToEnd("instant");
  });

  useEffect(() => {
    if (!pinnedToEnd || data.length === 0) return;
    stickToEnd();
  }, [data.length, pinnedToEnd]);

  const handleJumpToLatest = () => {
    scrollControlRef.current?.scrollToEnd("smooth");
    setPinnedToEnd(true);
  };

  return (
    <section
      aria-busy={busy}
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/60 bg-card/40",
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
              <p className="truncate text-sm font-semibold">{title}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div
            role="toolbar"
            aria-label="Log options"
            className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none"
          >
            <ImpactFlash watch={lines.length}>
              <Badge variant="muted" className="tabular-nums">
                {lines.length} lines
              </Badge>
            </ImpactFlash>
            <Tabs
              value={String(tail)}
              onValueChange={(value) => onTailChange(Number(value) as LogTail)}
            >
              <TabsList size="sm" aria-label="Tail lines">
                {LOG_TAIL_OPTIONS.map((option) => (
                  <TabsTrigger key={option} value={String(option)} className="tabular-nums">
                    {option}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <TooltipTrigger content="Copy output">
              <CopyableButton
                variant="icon"
                text={copyText}
                disabled={lines.length === 0}
                className="static size-8 w-8 rounded-md border border-border hover:bg-muted/50"
              />
            </TooltipTrigger>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
            <HugeiconsIcon icon={TerminalIcon} className="size-5" aria-hidden />
          </span>
          <p className="text-sm font-medium">No log lines yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Output will appear here as soon as the container writes to stdout or stderr.
          </p>
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <RowVirtualizer
            className="min-h-0 flex-1 px-1 py-2 font-mono text-[11px] leading-relaxed"
            data={data}
            estimateSize={estimateSize}
            overscan={12}
            getItemKey={(index) => index}
            scrollControlRef={scrollControlRef}
            onScrollToEnd={setPinnedToEnd}
            itemContent={logLineContent}
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
