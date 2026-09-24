import { useState } from "react";
import { SmartPopoverHost, Toaster, TooltipHost } from "@monrep/ui/base";
import { DbClient, DbProvider } from "@tanstack/react-db";
import type { ReactNode } from "react";
import { EnvHost } from "@/components/shell/EnvHost";

type Props = {
  children: ReactNode;
};

export function App({ children }: Props) {
  const [dbClient] = useState(() => new DbClient());

  return (
    <DbProvider client={dbClient}>
      <EnvHost />
      {children}

      <SmartPopoverHost />
      <TooltipHost />
      <Toaster />
    </DbProvider>
  );
}
