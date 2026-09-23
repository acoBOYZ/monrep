import { createStateSchema, createStreamDB } from "@durable-streams/state/db";
import { DO_MODULE_LIVE, DO_MODULE_STATE } from "../../do";
import type { ActionDefinition, StateSchema, StreamDB } from "@durable-streams/state/db";
import type { CreateDoModuleDbOpts } from "./types";

type SessionState = (typeof DO_MODULE_STATE)["session"];

/**
 * StreamDB factory. Gen supplies a typed actions callback.
 */
export const createDoStreamDB = <TActions extends Record<string, ActionDefinition>>(
  moduleId: "session",
  opts: CreateDoModuleDbOpts,
  actions: (ctx: { db: StreamDB<SessionState>; state: StateSchema<SessionState> }) => TActions,
) => {
  const state = createStateSchema(DO_MODULE_STATE.session);
  return createStreamDB({
    stream: opts.stream,
    onBatch: opts.onBatch,
    onBeforeBatch: opts.onBeforeBatch,
    state,
    live: opts.live ?? DO_MODULE_LIVE[moduleId],
    actions: ({ db }) => actions({ db, state }),
  });
};
