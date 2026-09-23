import { createStore } from "@tanstack/react-store";
import type { DoStreamDb } from "../collections/stream/types";
import type { TDoModuleId } from "../types";

type TStreamDbStore = {
  dbs: Partial<{ [TModule in TDoModuleId]: DoStreamDb<TModule> }>;
};

export const initialState: TStreamDbStore = {
  dbs: {},
};

export const streamDbStore = createStore<TStreamDbStore>(initialState);

/**
 * Destroys the stream db store and releases all resources.
 * This should be called when the app is unmounting.
 */
export const destroyStreamDbStore = () => {
  streamDbStore.setState((prev) => ({ ...prev, dbs: {} }));
};
