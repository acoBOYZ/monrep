import { createStateSchema, createStreamDB } from "@durable-streams/state/db";
import { DO_MODULE_LIVE, DO_MODULE_STATE } from "../../do";
import type { ActionDefinition, StateSchema, StreamDB } from "@durable-streams/state/db";
import type { TDoModuleId } from "../../types";
import type { CreateDoModuleDbOpts } from "./types";

type ModuleState<TModule extends TDoModuleId> = (typeof DO_MODULE_STATE)[TModule];

/**
 * StreamDB factory. Gen supplies a typed actions callback.
 */
export const createDoStreamDB = <
  TModule extends TDoModuleId,
  TActions extends Record<string, ActionDefinition>,
>(
  moduleId: TModule,
  opts: CreateDoModuleDbOpts,
  actions: (ctx: {
    db: StreamDB<StateSchema<ModuleState<TModule>>>;
    state: StateSchema<ModuleState<TModule>>;
  }) => TActions,
) => {
  const state = createStateSchema(DO_MODULE_STATE[moduleId]);
  return createStreamDB({
    stream: opts.stream,
    onBatch: opts.onBatch,
    onBeforeBatch: opts.onBeforeBatch,
    state,
    live: opts.live ?? DO_MODULE_LIVE[moduleId],
    actions: ({ db }) => actions({ db, state }),
  });
};
