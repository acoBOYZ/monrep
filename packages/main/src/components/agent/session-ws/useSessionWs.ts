import { useContext } from "react";
import { SessionWsContext } from "./sessionWsContext";
import type { SessionWsContextValue } from "./sessionWsContext";

export const useSessionWs = (): SessionWsContextValue => {
  const ctx = useContext(SessionWsContext);
  if (!ctx) throw new Error("useSessionWs must be used within a SessionWsProvider");
  return ctx;
};
