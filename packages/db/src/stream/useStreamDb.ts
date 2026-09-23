import { useSelector } from "@tanstack/react-store";
import { streamDbStore } from "./store";
import type { TDoModuleId } from "../types";

export const useStreamDb = <TModule extends TDoModuleId>(moduleId: TModule) => {
  const db = useSelector(streamDbStore, (s) => s.dbs[moduleId] ?? null);
  return { db, isReady: db != null };
};
