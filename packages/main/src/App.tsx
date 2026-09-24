import { useState } from "react";
import { StreamDbHost } from "@monrep/db/stream";
import { SmartPopoverHost, TooltipHost, Toaster } from "@monrep/ui/base";
import { DbClient, DbProvider, HydrationBoundary } from "@tanstack/react-db";
import type { ReactNode } from "react";
import type { DehydratedDbState } from "@tanstack/react-db";

type Props = {
  dehydratedDbState: DehydratedDbState;
  children: ReactNode;
};

export function App({ dehydratedDbState, children }: Props) {
  const [dbClient] = useState(() => new DbClient());

  return (
    <DbProvider client={dbClient}>
      <HydrationBoundary state={dehydratedDbState}>
        {children}

        {/* Hosts */}
        <StreamDbHost />
        <SmartPopoverHost />
        <TooltipHost />
        <Toaster />
      </HydrationBoundary>
    </DbProvider>
  );
}
