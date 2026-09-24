import { useSelector } from "@tanstack/react-store";
import { STREAM_MODULE_IDS } from "./acquire";
import { streamDbStore } from "./store";

/** True once every DO module StreamDB is in the host store. */
export const useStreamsReady = (): boolean =>
  useSelector(streamDbStore, (s) => STREAM_MODULE_IDS.every((id) => s.dbs[id] != null));
