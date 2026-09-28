import { useState } from "react";
import { Settings02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge, Button, Separator } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { cn } from "@monrep/utils";
import { KillContainersButton } from "./KillContainersButton";
import { RevokeServerButton } from "./RevokeServerButton";
import type { TServerDo } from "@/db/types";
import { AgentSettingsSheet } from "@/components/agent/settings/AgentSettingsSheet";
import { serverStatusVariant } from "@/components/agent/utils/serverStatus";
import { PageBreadcrumb } from "@/components/layouts/PageBreadcrumb";

type ServerDetailHeaderProps = {
  server: TServerDo;
  serverId: string;
  online: boolean;
};

export function ServerDetailHeader({ server, serverId, online }: ServerDetailHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="flex flex-col gap-2">
        <PageBreadcrumb items={[{ label: "Servers", to: "/servers" }]} current={server.name} />
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {server.name}
            </h1>
            <ImpactFlash watch={server.status} className="shrink-0">
              <Badge variant={serverStatusVariant(server.status)} className="gap-1.5 capitalize">
                <span
                  className={cn(
                    "size-1.5 rounded-full bg-current",
                    online && "animate-pulse motion-reduce:animate-none",
                  )}
                  aria-hidden
                />
                {server.status}
              </Badge>
            </ImpactFlash>
          </div>
          <div
            role="toolbar"
            aria-label="Server actions"
            className="ms-auto flex shrink-0 flex-wrap items-center gap-2"
          >
            <Button type="button" variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <HugeiconsIcon icon={Settings02Icon} className="size-4" aria-hidden />
              Settings
            </Button>
            <Separator
              orientation="vertical"
              className="my-0 hidden data-[orientation=vertical]:h-5 sm:block"
            />
            <KillContainersButton serverId={serverId} serverName={server.name} online={online} />
            <RevokeServerButton serverId={serverId} serverName={server.name} redirectToList />
          </div>
        </div>
      </header>
      <AgentSettingsSheet
        serverId={serverId}
        online={online}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}
