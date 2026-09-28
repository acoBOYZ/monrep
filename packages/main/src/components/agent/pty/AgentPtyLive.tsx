import { Badge } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { Terminal } from "@monrep/ui/terminal";
import { PtyPane } from "./PtyPane";
import type { SessionWsStatus } from "@/components/agent/session-ws/sessionWs";
import { useSessionWs } from "@/components/agent/session-ws/useSessionWs";

const ptyStatusBadgeVariant = (status: SessionWsStatus) => {
  if (status === "ready" || status === "connected") return "success";
  if (status === "connecting") return "warning";
  return "destructive";
};

export function AgentPtyLive() {
  const { serverId, ready, status, clearPane, fitAndResize } = useSessionWs();

  return (
    <section className="rounded-lg border border-border/60 bg-card/40">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2">
        <h2 className="text-sm font-semibold tracking-tight">Shell</h2>
        <ImpactFlash
          watch={status}
          render={(p) => (
            <Badge {...p} variant={ptyStatusBadgeVariant(status)} className="font-mono text-[10px]">
              {status}
            </Badge>
          )}
        />
      </div>
      <Terminal
        name={`pty-${serverId}`}
        height="360px"
        fillContent
        onClear={() => clearPane()}
        onMaximize={() => {
          requestAnimationFrame(() => fitAndResize());
        }}
      >
        <PtyPane wsReady={ready} />
      </Terminal>
    </section>
  );
}
