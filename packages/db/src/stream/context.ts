import { createContext, use } from "react";
import type { DoStreamDb } from "../collections/stream/types";
import type { TDoModuleId } from "../types";

export type StreamDbContextValue = {
  dbs: Partial<{ [TModule in TDoModuleId]: DoStreamDb<TModule> }>;
  ready: Partial<Record<TDoModuleId, boolean>>;
};

export const StreamDbContext = createContext<StreamDbContextValue | undefined>(undefined);

export const useStreamDb = <TModule extends TDoModuleId>(
  moduleId: TModule,
): { db: DoStreamDb<TModule> | null; isReady: boolean } => {
  const context = use(StreamDbContext);
  if (!context) {
    throw new Error("useStreamDb must be used within a StreamDbProvider");
  }
  const db = context.dbs[moduleId] ?? null;
  return { db, isReady: Boolean(context.ready[moduleId] && db) };
};
