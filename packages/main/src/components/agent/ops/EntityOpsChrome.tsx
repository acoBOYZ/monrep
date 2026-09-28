import { ArrowReloadHorizontalIcon, TerminalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert, AlertDescription, Badge, Button } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { Crumb } from "@/components/layouts/PageBreadcrumb";
import { PageBreadcrumb } from "@/components/layouts/PageBreadcrumb";

type EntityOpsChromeProps = {
  serverId: string;
  serverName: string;
  title: string;
  /** Extra ancestors between the server and this page (e.g. Docker → container). */
  crumbs?: ReadonlyArray<Crumb>;
  counts: { total: number; totalLabel: string; bad: number; badLabel: string };
  online: boolean;
  busy: boolean;
  error: string | null;
  listError: string | null;
  listErrorVariant?: "default" | "destructive";
  layout?: "split" | "stack";
  onRefresh: () => void;
  onCancel: () => void;
  toolbar?: ReactNode;
  children: ReactNode;
};

export function EntityOpsChrome({
  serverId,
  serverName,
  title,
  crumbs = [],
  counts,
  online,
  busy,
  error,
  listError,
  listErrorVariant = "destructive",
  layout = "split",
  onRefresh,
  onCancel,
  toolbar,
  children,
}: EntityOpsChromeProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-2">
        <PageBreadcrumb
          items={[
            { label: "Servers", to: "/servers" },
            { label: serverName, to: "/servers/$id", params: { id: serverId } },
            ...crumbs,
          ]}
          current={title}
        />
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {title}
            </h1>
            {counts.total > 0 ? (
              <ImpactFlash watch={counts.total}>
                <Badge variant="muted" className="tabular-nums">
                  {counts.total} {counts.totalLabel}
                </Badge>
              </ImpactFlash>
            ) : null}
            {counts.bad > 0 ? (
              <ImpactFlash watch={counts.bad}>
                <Badge variant="destructive" className="tabular-nums">
                  {counts.bad} {counts.badLabel}
                </Badge>
              </ImpactFlash>
            ) : null}
          </div>
          <div
            role="toolbar"
            aria-label="Page actions"
            className="ms-auto flex shrink-0 flex-wrap items-center gap-2"
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!online || busy}
              onClick={onRefresh}
            >
              <HugeiconsIcon icon={ArrowReloadHorizontalIcon} className="size-4" aria-hidden />
              Refresh
            </Button>
            {busy ? (
              <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
            <Button
              nativeButton={false}
              variant="ghost"
              size="sm"
              render={<Link to="/servers/$id" params={{ id: serverId }} />}
            >
              <HugeiconsIcon icon={TerminalIcon} className="size-4" aria-hidden />
              Shell
            </Button>
          </div>
        </div>
      </header>

      {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}

      {!online ? (
        <Alert>
          <AlertDescription>Agent offline — connect the agent to run commands.</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {listError ? (
        <Alert variant={listErrorVariant === "destructive" ? "destructive" : undefined}>
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      ) : null}

      <div
        className={
          layout === "stack"
            ? "flex h-fit max-h-[calc(100svh-13rem)] min-h-0 flex-col gap-4"
            : "grid h-fit max-h-[calc(100svh-13rem)] min-h-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        }
      >
        {children}
      </div>
    </main>
  );
}
