import { cn } from "@monrep/utils";
import { FRAME_CLASS } from "./frame";

export function PageGutterHatches() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className={cn(FRAME_CLASS, "relative h-full")}>
        <div className="absolute inset-y-0 left-0 border-l border-border/40" />
        <div className="absolute inset-y-0 right-0 border-r border-border/40" />
      </div>
    </div>
  );
}
