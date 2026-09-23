import { useEffect } from "react";
import { STREAM_MODULE_IDS, acquireStreamModule, releaseStreamModule } from "./acquire";
import { destroyStreamDbStore, streamDbStore } from "./store";

export function StreamDbHost() {
  useEffect(() => {
    let cancelled = false;

    for (const moduleId of STREAM_MODULE_IDS) {
      void acquireStreamModule(moduleId)
        .then((session) => {
          if (cancelled) {
            releaseStreamModule(moduleId);
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
      for (const moduleId of STREAM_MODULE_IDS) {
        releaseStreamModule(moduleId);
      }
      destroyStreamDbStore();
    };
  }, []);

  return null;
}
