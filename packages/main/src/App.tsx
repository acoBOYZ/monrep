import { useState } from "react";
import { NetworkEnv, ThemeEnv, TimerEnv, ViewportEnv } from "@monrep/runtime";
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
      <NetworkEnv />
      <ThemeEnv />
      <TimerEnv />
      <ViewportEnv />

      {children}

      <SmartPopoverHost />
      <TooltipHost />
      <Toaster />
    </DbProvider>
  );
}
