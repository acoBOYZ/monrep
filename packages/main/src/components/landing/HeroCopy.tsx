import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge, Button } from "@monrep/ui/base";
import { Link } from "@tanstack/react-router";
import { GITHUB_URL } from "../../brand.gen";

export function HeroCopy() {
  return (
    <div className="flex flex-col gap-4">
      <Badge variant="muted" className="w-fit font-mono text-[11px]">
        self-hosted control plane
      </Badge>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        Your servers. One console. Realtime.
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Install a small agent on each Linux host. Docker, systemd, shell, and live monitors from a
        single browser tab.
      </p>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button size="sm" render={<Link to="/admin" />} nativeButton={false}>
          Open console
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              GitHub
              <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-4" aria-hidden />
            </a>
          }
        />
      </div>
    </div>
  );
}
