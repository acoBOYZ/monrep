import { Badge, CopyableButton } from "@monrep/ui/base";
import { INSTALL_COMMAND } from "../../brand.gen";
import { InstallSteps } from "./InstallSteps";

export function InstallPanel() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">Install agent</span>
        <Badge variant="muted" className="font-mono text-[11px]">
          linux · bash
        </Badge>
      </div>
      <CopyableButton
        text={INSTALL_COMMAND}
        variant="block"
        className="overflow-hidden rounded-md bg-muted/40"
      >
        <pre className="min-w-0 flex-1 overflow-x-auto p-2 px-3 pr-12 font-mono text-xs leading-relaxed">
          <code>{INSTALL_COMMAND}</code>
        </pre>
      </CopyableButton>
      <InstallSteps />
    </div>
  );
}
