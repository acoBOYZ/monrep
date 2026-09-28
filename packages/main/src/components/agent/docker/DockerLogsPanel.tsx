import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  Badge,
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

const estimateSize = () => 18;

function logLineContent(_index: number, line: string) {
  return <div className="wrap-break-word whitespace-pre-wrap text-foreground">{line || " "}</div>;
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

  const stickToEnd = useEffectEvent(() => {
    scrollControlRef.current?.scrollToEnd("instant");
  });

  useEffect(() => {
    if (!pinnedToEnd || data.length === 0) return;
    stickToEnd();
  }, [data.length, pinnedToEnd]);

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
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                Tail
              </span>
              <Tabs
                value={String(tail)}
                onValueChange={(value) => onTailChange(Number(value) as LogTail)}
              >
                <TabsList size="sm">
                  {LOG_TAIL_OPTIONS.map((option) => (
                    <TabsTrigger key={option} value={String(option)}>
                      {option}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <TooltipTrigger content="Copy output">
              <CopyableButton variant="icon" text={copyText} disabled={lines.length === 0} />
            </TooltipTrigger>
            <ImpactFlash watch={lines.length}>
              <Badge variant="muted">{lines.length} lines</Badge>
            </ImpactFlash>
          </div>
        </div>
      </div>

      {!busy && lines.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">No log lines yet</p>
        </div>
      ) : (
        <RowVirtualizer
          className="min-h-0 flex-1 px-3 py-2 font-mono text-[11px] leading-relaxed"
          data={data}
          estimateSize={estimateSize}
          overscan={12}
          getItemKey={(index) => index}
          scrollControlRef={scrollControlRef}
          onScrollToEnd={setPinnedToEnd}
          itemContent={logLineContent}
        />
      )}
    </div>
  );
}
