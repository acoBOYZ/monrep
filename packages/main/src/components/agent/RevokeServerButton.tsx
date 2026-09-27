import { Button, CopyableButton } from "@monrep/ui/base";
import { tryCatch } from "@monrep/utils";
import { useNavigate } from "@tanstack/react-router";
import type { ConsequenceItem } from "@/components/danger-delete";
import { SteppedConditionalDeletePopover } from "@/components/danger-delete";
import { revokeServerFn } from "@/server/agent/functions";

const REVOKE_CONSEQUENCES: Array<ConsequenceItem> = [
  { id: "disconnect", content: "Any connected agent session for this server will stop." },
  { id: "creds", content: "Device credentials and enroll tokens are permanently deleted." },
  { id: "data", content: "Runtime config and collected samples for this server are removed." },
  { id: "list", content: "The server disappears from the fleet list." },
];

type RevokeServerButtonProps = {
  serverId: string;
  serverName: string;
  /** When true, navigate to /servers after a successful revoke (detail page). */
  redirectToList?: boolean;
  size?: "sm" | "default";
};

export function RevokeServerButton({
  serverId,
  serverName,
  redirectToList = false,
  size = "sm",
}: RevokeServerButtonProps) {
  const navigate = useNavigate();

  return (
    <SteppedConditionalDeletePopover
      id={serverId}
      displayName={serverName}
      title="Revoke server"
      warningText="Revoking permanently removes this server from the control plane."
      consequences={REVOKE_CONSEQUENCES}
      requireMatch={serverName}
      inputLabel={
        <>
          Type <CopyableButton text={serverName} variant="inline" /> to confirm
        </>
      }
      placeholder={serverName}
      confirmLabel="Revoke server"
      cancelLabel="Cancel"
      step1ContinueLabel="Continue"
      step2AcknowledgeLabel="I understand the consequences"
      trigger={
        <Button type="button" variant="outline" size={size}>
          Revoke
        </Button>
      }
      onDelete={async (id) => {
        const { error } = await tryCatch(revokeServerFn({ data: { serverId: id } }));
        if (error !== null) throw error;
        if (redirectToList) {
          await navigate({ to: "/servers" });
        }
      }}
    />
  );
}
