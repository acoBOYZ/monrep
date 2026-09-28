import { Badge } from "@monrep/ui/base";

export function WaitingBadge() {
  return (
    <Badge variant="warning" className="gap-1.5">
      <span aria-hidden className="size-2 animate-pulse rounded-sm bg-warning-foreground" />
      waiting for agent
    </Badge>
  );
}
