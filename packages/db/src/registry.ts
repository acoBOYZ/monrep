import type { z } from "zod";
import type { CreateDoModuleDbOpts } from "./collections/stream/opts";
import type { TStreamEpoch, TStreamLive } from "./module";

export type DoModuleStateEntry = {
  schema: z.ZodType;
  type: string;
  primaryKey: string;
};

export type DoModuleBuilt = {
  moduleId: string;
  streamEpoch?: TStreamEpoch;
  streamLive: TStreamLive;
  streamPersist: boolean;
  collections: Record<
    string,
    {
      name: string;
      primaryKey: string;
      indexes: ReadonlyArray<string>;
      Schema: z.ZodType;
      insertGens: unknown;
      updateGens: unknown;
    }
  >;
};

/** App-owned Durable Streams catalog (from codegen). Bind once per Worker isolate. */
export type DoRegistry = {
  epoch: Partial<Record<string, TStreamEpoch | undefined>>;
  persist: Record<string, boolean>;
  live: Record<string, TStreamLive>;
  state: Record<string, Record<string, DoModuleStateEntry>>;
  modules: Record<string, DoModuleBuilt>;
  factories: Record<string, (opts: CreateDoModuleDbOpts) => DoStreamDbInstance>;
};

/** Loose StreamDB instance shape used by acquire / host (app gens refine further). */
export type DoStreamDbInstance = {
  preload: () => Promise<unknown>;
  close: () => void;
  collections: Record<string, unknown>;
  actions: Record<string, unknown>;
};

let bound: DoRegistry | null = null;

export function bindDoRegistry(registry: DoRegistry): void {
  bound = registry;
}

export function getDoRegistry(): DoRegistry {
  if (!bound) {
    throw new Error(
      "@monrep/db: bind the app DO catalog before using streams (import DOHost from @/db/host, or call bindDoApp() on the server)",
    );
  }
  return bound;
}

export function getStreamModuleIds(): Array<string> {
  return Object.keys(getDoRegistry().factories);
}

export function isDoRegistryBound(): boolean {
  return bound != null;
}
