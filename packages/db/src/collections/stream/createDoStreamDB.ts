import { createStateSchema, createStreamDB } from "@durable-streams/state/db";
import type {
  ActionDefinition,
  CollectionDefinition,
  StateSchema,
  StreamDB,
} from "@durable-streams/state/db";
import type { CreateDoModuleDbOpts } from "./opts";

/**
 * StreamDB factory. Gen supplies module state + a typed actions callback.
 * Default live comes from `opts.live` (gen sets module default).
 */
export const createDoStreamDB = <
  TState extends Record<string, CollectionDefinition>,
  TActions extends Record<string, ActionDefinition>,
>(
  moduleState: TState,
  opts: CreateDoModuleDbOpts,
  actions: (ctx: { db: StreamDB<StateSchema<TState>>; state: StateSchema<TState> }) => TActions,
) => {
  const state = createStateSchema(moduleState);
  return createStreamDB({
    stream: opts.stream,
    onBatch: opts.onBatch,
    onBeforeBatch: opts.onBeforeBatch,
    state,
    live: opts.live ?? "long-poll",
    actions: ({ db }) => actions({ db, state }),
  });
};
