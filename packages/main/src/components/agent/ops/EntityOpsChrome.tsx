import { ArrowLeft01Icon, ArrowReloadHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert, AlertDescription, Badge, Button } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type EntityOpsChromeProps = {
  serverId: string;
  serverName: string;
  title: string;
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button
            nativeButton={false}
            variant="ghost"
            size="sm"
            render={<Link to="/servers/$id" params={{ id: serverId }} />}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" aria-hidden />
            {serverName}
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <ImpactFlash watch={counts.total}>
            <Badge variant="muted">
              {counts.total} {counts.totalLabel}
            </Badge>
          </ImpactFlash>
          {counts.bad > 0 ? (
            <ImpactFlash watch={counts.bad}>
              <Badge variant="destructive">
                {counts.bad} {counts.badLabel}
              </Badge>
            </ImpactFlash>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            Shell
          </Button>
        </div>
      </div>

      {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}

      {!online ? (
        <Alert>
          <AlertDescription>Agent offline — connect the daemon to run commands.</AlertDescription>
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
