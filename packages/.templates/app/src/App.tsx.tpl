import { useState } from "react";
import { Toaster, TooltipHost } from "@monrep/ui/base";
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
      <TooltipHost />
      <Toaster />
    </DbProvider>
  );
}
