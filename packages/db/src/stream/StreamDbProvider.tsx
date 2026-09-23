import { useEffect, useState } from "react";
import { STREAM_MODULE_IDS, acquireStreamModule, releaseStreamModule } from "./acquire";
import { StreamDbContext } from "./context";
import type { ReactNode } from "react";
import type { StreamDbContextValue } from "./context";

const EMPTY_STREAM_DB: StreamDbContextValue = { dbs: {}, ready: {} };

export function StreamDbProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState(EMPTY_STREAM_DB);

  useEffect(() => {
    let cancelled = false;

    for (const moduleId of STREAM_MODULE_IDS) {
      void acquireStreamModule(moduleId)
        .then((session) => {
          if (cancelled) {
            releaseStreamModule(moduleId);
            return;
          }
          setValue((prev) => ({
            dbs: { ...prev.dbs, [moduleId]: session.db },
            ready: { ...prev.ready, [moduleId]: true },
          }));
        })
        .catch((error: unknown) => {
          console.error("[StreamDbProvider] preload failed", error);
        });
    }

    return () => {
      cancelled = true;
      for (const moduleId of STREAM_MODULE_IDS) releaseStreamModule(moduleId);
    };
  }, []);

  return <StreamDbContext value={value}>{children}</StreamDbContext>;
}
