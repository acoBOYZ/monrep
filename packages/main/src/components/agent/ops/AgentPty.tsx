import { Badge } from "@monrep/ui/base";
import { Terminal } from "@monrep/ui/terminal";
import { AgentPtyLive } from "@/components/agent/pty/AgentPtyLive";

type AgentPtyProps = {
  serverId: string;
  online: boolean;
};

export function AgentPty({ serverId, online }: AgentPtyProps) {
  if (!online) {
    return (
      <section className="rounded-lg border border-border/60 bg-card/40">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2">
          <h2 className="text-sm font-semibold tracking-tight">Shell</h2>
          <Badge variant="muted" className="font-mono text-[10px]">
            offline
          </Badge>
        </div>
        <Terminal name={`pty-${serverId}`} height="360px" />
      </section>
    );
  }

  return <AgentPtyLive />;
}
