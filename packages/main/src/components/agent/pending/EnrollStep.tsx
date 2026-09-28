import { CopyableButton } from "@monrep/ui/base";
import type { ReactNode } from "react";

type EnrollStepProps = {
  index: number;
  heading: string;
  command: string;
  note?: ReactNode;
};

export function EnrollStep({ index, heading, command, note }: EnrollStepProps) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border/60 font-mono text-xs text-muted-foreground">
        {index}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-sm font-medium">{heading}</p>
        <CopyableButton
          text={command}
          variant="block"
          className="overflow-hidden rounded-md border border-border/60 bg-muted/30"
        >
          <pre className="min-w-0 flex-1 overflow-x-auto p-2.5 pr-12 font-mono text-xs leading-relaxed">
            <code>{command}</code>
          </pre>
        </CopyableButton>
        {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      </div>
    </li>
  );
}
