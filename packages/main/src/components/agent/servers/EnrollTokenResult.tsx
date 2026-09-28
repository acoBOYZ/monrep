import { Button } from "@monrep/ui/base";
import { Link } from "@tanstack/react-router";
import { EnrollSteps } from "@/components/agent/pending/EnrollSteps";

export type EnrollTokenResultProps = {
  serverId: string | null;
  enrollToken: string;
  expiresAt: string;
};

export function EnrollTokenResult({ serverId, enrollToken, expiresAt }: EnrollTokenResultProps) {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <EnrollSteps enrollToken={enrollToken} expiresAt={expiresAt} />
      <div className="flex flex-wrap items-center gap-2">
        {serverId ? (
          <Button
            nativeButton={false}
            render={<Link to="/servers/$id" params={{ id: serverId }} />}
          >
            Open server
          </Button>
        ) : null}
        <Button nativeButton={false} render={<Link to="/servers" />} variant="ghost" size="sm">
          Back to servers
        </Button>
      </div>
    </div>
  );
}
