import { useEffect, useState } from "react";
import {
  acquireStreamModule,
  getStreamModuleIdList,
  releaseStreamModule,
  streamEpochLabel,
  subscribeStreamEpoch,
} from "./acquire";
import { destroyStreamDbStore, streamDbStore } from "./store";

const initialEpochs = (): Record<string, string> => {
  const next: Record<string, string> = {};
  for (const id of getStreamModuleIdList()) next[id] = streamEpochLabel(id);
  return next;
};

/** Library host: acquire stream modules (catalog must already be bound). Apps mount `<DOHost />`. */
export function StreamDbHost() {
  const [epochs, setEpochs] = useState(initialEpochs);

  useEffect(() => {
    const moduleIds = getStreamModuleIdList();
    const unsubs = moduleIds.map((moduleId) =>
      subscribeStreamEpoch(moduleId, (epoch) => {
        setEpochs((prev) => (prev[moduleId] === epoch ? prev : { ...prev, [moduleId]: epoch }));
      }),
    );
    return () => {
      for (const unsub of unsubs) unsub();
      destroyStreamDbStore();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const moduleIds = getStreamModuleIdList();
    const held: Array<{ moduleId: string; epoch: string }> = [];

    for (const moduleId of moduleIds) {
      const epoch = epochs[moduleId] ?? streamEpochLabel(moduleId);
      held.push({ moduleId, epoch });
      void acquireStreamModule(moduleId, epoch)
        .then((session) => {
          if (cancelled) {
            releaseStreamModule(moduleId, epoch);
            return;
          }
          streamDbStore.setState((prev) => ({
            ...prev,
            dbs: { ...prev.dbs, [moduleId]: session.db },
          }));
        })
        .catch((error: unknown) => {
          console.error("[StreamDbHost] preload failed", error);
        });
    }

    return () => {
      cancelled = true;
      for (const item of held) {
        releaseStreamModule(item.moduleId, item.epoch);
      }
    };
  }, [epochs]);

  return null;
}
