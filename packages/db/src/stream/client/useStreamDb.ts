import { useSelector } from "@tanstack/react-store";
import { getStreamModuleIdList } from "./acquire";
import { streamDbStore } from "./store";

export const useStreamDb = (moduleId: string) => {
  const db = useSelector(streamDbStore, (s) => s.dbs[moduleId] ?? null);
  return { db, isReady: db != null };
};

export const useStreamsReady = (): boolean =>
  useSelector(streamDbStore, (s) => getStreamModuleIdList().every((id) => s.dbs[id] != null));
