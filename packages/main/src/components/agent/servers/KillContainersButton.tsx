import { StopCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, CopyableButton, TooltipTrigger } from "@monrep/ui/base";
import { tryCatch } from "@monrep/utils";
import type { ConsequenceItem } from "@/components/danger-delete";
import { SteppedConditionalDeletePopover } from "@/components/danger-delete";
import { sendAgentRunFn } from "@/server/agent/functions";

const KILL_ARGV = [
  "/bin/sh",
  "-c",
  "ids=$(docker ps -q); if [ -n \"$ids\" ]; then docker stop $ids; else echo 'no running containers'; fi",
];

const CONSEQUENCES: Array<ConsequenceItem> = [
  { id: "stop", content: "All currently running Docker containers on this host will be stopped." },
  {
    id: "services",
    content: "systemd services are not touched — stop those per-unit on the Services page.",
  },
  { id: "data", content: "Containers are not removed; only docker stop is issued." },
];

type KillContainersButtonProps = {
  serverId: string;
  serverName: string;
  online: boolean;
  onStarted?: (runId: string) => void;
};

export function KillContainersButton({
  serverId,
  serverName,
  online,
  onStarted,
}: KillContainersButtonProps) {
  return (
    <SteppedConditionalDeletePopover
      id={serverId}
      displayName={serverName}
      headerTitle="Kill switch — stop containers"
      warningText="Emergency stop for running Docker containers only. systemd units are left alone."
      consequences={CONSEQUENCES}
      requireMatch={serverName}
      inputLabel={
        <>
          Type <CopyableButton text={serverName} variant="inline" /> to confirm
        </>
      }
      placeholder={serverName}
      confirmLabel="Stop all containers"
      cancelLabel="Cancel"
      step1ContinueLabel="Continue"
      step2AcknowledgeLabel="I understand the consequences"
      trigger={
        !online ? (
          <TooltipTrigger content="Agent offline">
            <Button type="button" variant="destructive" size="sm" disabled>
              <HugeiconsIcon icon={StopCircleIcon} className="size-4" aria-hidden />
              Kill
              <span className="hidden sm:inline"> switch</span>
            </Button>
          </TooltipTrigger>
        ) : (
          <Button type="button" variant="destructive" size="sm">
            <HugeiconsIcon icon={StopCircleIcon} className="size-4" aria-hidden />
            Kill
            <span className="hidden sm:inline"> switch</span>
          </Button>
        )
      }
      onDelete={async () => {
        if (!online) throw new Error("agent offline");
        const { data, error } = await tryCatch(
          sendAgentRunFn({ data: { serverId, argv: KILL_ARGV } }),
        );
        if (error !== null) throw error;
        if (!data.ok) throw new Error("session not connected");
        onStarted?.(data.runId);
      }}
    />
  );
}
