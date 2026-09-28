import { Badge, Button, TableCell, TableRow, TooltipTrigger } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";
import { toDateTimeAttr } from "@monrep/utils";
import { Link } from "@tanstack/react-router";
import { RevokeServerButton } from "./RevokeServerButton";
import type { TServerDo } from "@/db/types";
import { serverStatusVariant } from "@/components/agent/utils/serverStatus";

type ServerRowProps = {
  server: TServerDo;
};

export function ServerRow({ server }: ServerRowProps) {
  const id = server.id;
  const deviceId = server.deviceId;
  const deviceShort = deviceId && deviceId.length > 12 ? `${deviceId.slice(0, 12)}…` : deviceId;
  const lastSeenIso = server.lastSeenAt;
  const lastSeenShort = lastSeenIso
    ? (toDateTimeAttr(lastSeenIso)?.slice(0, 19) ?? lastSeenIso.slice(0, 19))
    : "—";

  return (
    <TableRow className="h-10">
      <TableCell className="font-medium">
        {id ? (
          <Link to="/servers/$id" params={{ id }} className="hover:underline">
            {server.name}
          </Link>
        ) : (
          server.name
        )}
      </TableCell>
      <TableCell>
        <ImpactFlash watch={server.status}>
          <Badge variant={serverStatusVariant(server.status)} className="capitalize">
            {server.status}
          </Badge>
        </ImpactFlash>
      </TableCell>
      <TableCell className="overflow-hidden font-mono text-xs">
        {deviceId ? (
          <TooltipTrigger content={deviceId} className="max-w-full min-w-0">
            <span className="block truncate">{deviceShort}</span>
          </TooltipTrigger>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="font-mono text-xs">{server.agentVersion ?? "—"}</TableCell>
      <TableCell className="font-mono text-xs">
        <ImpactFlash watch={lastSeenIso}>
          {lastSeenIso ? (
            <TooltipTrigger content={lastSeenIso}>
              <span>{lastSeenShort}</span>
            </TooltipTrigger>
          ) : (
            "—"
          )}
        </ImpactFlash>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          {id ? (
            <Button
              nativeButton={false}
              render={<Link to="/servers/$id" params={{ id }} />}
              variant="ghost"
              size="sm"
            >
              Open
            </Button>
          ) : null}
          {id ? <RevokeServerButton serverId={id} serverName={server.name} /> : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
