import { useState } from "react";
import { ArrowLeft01Icon, Settings02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge, Button } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { Link } from "@tanstack/react-router";
import { KillContainersButton } from "./KillContainersButton";
import { RevokeServerButton } from "./RevokeServerButton";
import type { TServerDo } from "@/db/types";
import { AgentSettingsSheet } from "@/components/agent/settings/AgentSettingsSheet";
import { serverStatusVariant } from "@/components/agent/utils/serverStatus";

type ServerDetailHeaderProps = {
  server: TServerDo;
  serverId: string;
  online: boolean;
};

export function ServerDetailHeader({ server, serverId, online }: ServerDetailHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Button nativeButton={false} variant="ghost" size="sm" render={<Link to="/servers" />}>
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" aria-hidden />
            Servers
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">{server.name}</h1>
          <ImpactFlash watch={server.status}>
            <Badge variant={serverStatusVariant(server.status)} className="capitalize">
              {server.status}
            </Badge>
          </ImpactFlash>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <HugeiconsIcon icon={Settings02Icon} className="size-4" aria-hidden />
            Settings
          </Button>
          <KillContainersButton serverId={serverId} serverName={server.name} online={online} />
          <RevokeServerButton serverId={serverId} serverName={server.name} redirectToList />
        </div>
      </div>
      <AgentSettingsSheet
        serverId={serverId}
        online={online}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}
