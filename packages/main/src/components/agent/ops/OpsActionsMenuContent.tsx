import { useState } from "react";
import {
  ArrowTurnBackwardIcon,
  SquareArrowReload01Icon,
  SquarePowerIcon,
  SquareStopIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@monrep/ui/base";

export type OpsActionsMenuContentProps = {
  name: string;
  close: () => void;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
};

export function OpsActionsMenuContent({
  name,
  close,
  onStart,
  onStop,
  onRestart,
}: OpsActionsMenuContentProps) {
  const [confirm, setConfirm] = useState<"stop" | "restart" | null>(null);

  if (confirm) {
    return (
      <div className="flex flex-col gap-2 p-1">
        <p className="px-2 text-xs text-muted-foreground">
          {confirm === "stop" ? "Stop" : "Restart"} {name}?
        </p>
        <div className="flex gap-1 px-1">
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={() => {
              if (confirm === "stop") onStop();
              else onRestart();
              setConfirm(null);
              close();
            }}
          >
            <HugeiconsIcon
              icon={confirm === "stop" ? SquareStopIcon : SquareArrowReload01Icon}
              className="size-4"
              aria-hidden
            />
            {confirm === "stop" ? "Stop" : "Restart"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setConfirm(null)}>
            <HugeiconsIcon icon={ArrowTurnBackwardIcon} className="size-4" aria-hidden />
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="w-full justify-start"
        onClick={() => {
          onStart();
          close();
        }}
      >
        <HugeiconsIcon icon={SquarePowerIcon} className="size-4 text-success" aria-hidden />
        Start
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="w-full justify-start"
        onClick={() => setConfirm("stop")}
      >
        <HugeiconsIcon icon={SquareStopIcon} className="size-4 text-destructive" aria-hidden />
        Stop
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="w-full justify-start"
        onClick={() => setConfirm("restart")}
      >
        <HugeiconsIcon icon={SquareArrowReload01Icon} className="size-4 text-warning" aria-hidden />
        Restart
      </Button>
    </div>
  );
}
