import { useEffect, useState } from "react";
import {
  STREAM_MODULE_IDS,
  acquireStreamModule,
  releaseStreamModule,
  streamEpochLabel,
  subscribeStreamEpoch,
} from "./acquire";
import { destroyStreamDbStore, streamDbStore } from "./store";

const initialEpochs = (): Record<string, string> => {
  const next: Record<string, string> = {};
  for (const id of STREAM_MODULE_IDS) next[id] = streamEpochLabel(id);
  return next;
};

export function StreamDbHost() {
  const [epochs, setEpochs] = useState(initialEpochs);

  useEffect(() => {
    const unsubs = STREAM_MODULE_IDS.map((moduleId) =>
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
    const held: Array<{ moduleId: (typeof STREAM_MODULE_IDS)[number]; epoch: string }> = [];

    for (const moduleId of STREAM_MODULE_IDS) {
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
