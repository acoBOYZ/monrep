import { EnrollSteps } from "./EnrollSteps";
import { PendingStatusCard } from "./PendingStatusCard";
import { WaitingBadge } from "./WaitingBadge";
import { RevokeServerButton } from "@/components/agent/servers/RevokeServerButton";
import { PageBreadcrumb } from "@/components/layouts/PageBreadcrumb";

type PendingServerPageProps = {
  serverId: string;
  name: string;
  createdAt?: string;
};

export function PendingServerPage({ serverId, name, createdAt }: PendingServerPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-2">
        <PageBreadcrumb items={[{ label: "Servers", to: "/servers" }]} current={name} />
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {name}
            </h1>
            <WaitingBadge />
          </div>
          <div className="ms-auto shrink-0">
            <RevokeServerButton serverId={serverId} serverName={name} redirectToList />
          </div>
        </div>
      </header>
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <EnrollSteps />
        <PendingStatusCard serverId={serverId} createdAt={createdAt} />
      </div>
    </main>
  );
}
