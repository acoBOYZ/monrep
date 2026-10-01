import { ExpandIcon, MinusIcon, XIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { KbdGroup, TooltipTrigger } from "../../base";

export type WindowButtonsProps = {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
};

function MaximizeTooltipContent() {
  return (
    <div className="flex max-w-52 flex-col gap-1.5 text-left">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">Maximize</p>
        <KbdGroup hotkey="Mod+J" variant="outline" />
      </div>
      <p className="text-xs leading-snug text-muted-foreground">
        Expand or restore the terminal. Same shortcut toggles both.
      </p>
    </div>
  );
}

export const WindowButtons = ({ onMaximize }: WindowButtonsProps) => (
  <div className="group/twb absolute top-2.5 left-2.5 z-10 flex flex-row gap-2">
    <button
      type="button"
      aria-label="Close"
      disabled
      aria-disabled
      className="flex size-3 cursor-not-allowed items-center justify-center rounded-sm border-0 bg-destructive"
    >
      <HugeiconsIcon
        icon={XIcon}
        className="size-2.5 text-background opacity-0 transition-opacity duration-300 group-hover/twb:opacity-100"
        strokeWidth={4}
      />
    </button>
    <button
      type="button"
      aria-label="Minimize"
      disabled
      aria-disabled
      className="flex size-3 cursor-not-allowed items-center justify-center rounded-sm border-0 bg-warning"
    >
      <HugeiconsIcon
        icon={MinusIcon}
        className="size-2.5 text-background opacity-0 transition-opacity duration-300 group-hover/twb:opacity-100"
        strokeWidth={4}
      />
    </button>
    <TooltipTrigger content={<MaximizeTooltipContent />}>
      <button
        type="button"
        aria-label="Maximize"
        className="flex size-3 cursor-pointer items-center justify-center rounded-sm border-0 bg-success"
        onClick={(event) => {
          event.stopPropagation();
          onMaximize();
        }}
      >
        <HugeiconsIcon
          icon={ExpandIcon}
          className="size-2.5 text-background opacity-0 transition-opacity duration-300 group-hover/twb:opacity-100"
          strokeWidth={4}
        />
      </button>
    </TooltipTrigger>
  </div>
);
