import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@monrep/ui/base";
import { Link } from "@tanstack/react-router";
import { EnrollSteps } from "./EnrollSteps";
import { PendingStatusCard } from "./PendingStatusCard";
import { WaitingBadge } from "./WaitingBadge";
import { RevokeServerButton } from "@/components/agent/servers/RevokeServerButton";

type PendingServerPageProps = {
  serverId: string;
  name: string;
  createdAt?: string;
};

export function PendingServerPage({ serverId, name, createdAt }: PendingServerPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Button nativeButton={false} variant="ghost" size="sm" render={<Link to="/servers" />}>
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" aria-hidden />
            Servers
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">{name}</h1>
          <WaitingBadge />
        </div>
        <RevokeServerButton serverId={serverId} serverName={name} redirectToList />
      </div>
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <EnrollSteps />
        <PendingStatusCard serverId={serverId} createdAt={createdAt} />
      </div>
    </main>
  );
}
