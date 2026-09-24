import { useState } from "react";
import { StreamDbHost } from "@monrep/db/stream";
import { SmartPopoverHost, Toaster, TooltipHost } from "@monrep/ui/base";
import { DbClient, DbProvider } from "@tanstack/react-db";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function App({ children }: Props) {
  const [dbClient] = useState(() => new DbClient());

  return (
    <DbProvider client={dbClient}>
      {children}

      {/* Hosts */}
      <StreamDbHost />
      <SmartPopoverHost />
      <TooltipHost />
      <Toaster />
    </DbProvider>
  );
}
