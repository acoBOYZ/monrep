import { useSelector } from "@tanstack/react-store";
import { STREAM_MODULE_IDS } from "./acquire";
import { streamDbStore } from "./store";
import type { TDoModuleId } from "../types";

export const useStreamDb = <TModule extends TDoModuleId>(moduleId: TModule) => {
  const db = useSelector(streamDbStore, (s) => s.dbs[moduleId] ?? null);
  return { db, isReady: db != null };
};

export const useStreamsReady = (): boolean =>
  useSelector(streamDbStore, (s) => STREAM_MODULE_IDS.every((id) => s.dbs[id] != null));
