// @generated — AUTO-GENERATED FILE. DO NOT EDIT.
//
// Generator : @monrep/codegen (DO TanStack DB collections)
// Task      : dbCollectionsDo
// Source    : packages/db/src/do/*.ts
//
// Regenerate: bun run codegen
// Watch     : bun run --cwd packages/codegen watch
//
// Edit instead: DO schema files under packages/db/src/do/

import {
	DO_MODULE_LIVE,
	PresenceDoSchema,
	TypingDoSchema,
	UsersDoSchema
} from "../do";
import { createStateSchema, createStreamDB } from "@durable-streams/state/db";
import { createDeleteStreamAction, createUpsertStreamAction } from "./stream/streamActionHelpers";
import type { ActionDefinition } from "@durable-streams/state/db";
import type {
	TDoModuleId,
	TPresenceDo,
	TTypingDo,
	TUsersDo
} from "../types";
import type { CreateDoModuleDbOpts } from "./stream/types";

/** Concrete StreamDB factory for module `session`. */
const createSessionStreamDB = (opts: CreateDoModuleDbOpts) => {
  const state = createStateSchema({
    presence: { schema: PresenceDoSchema, type: "presence", primaryKey: "userId" },
    typing: { schema: TypingDoSchema, type: "typing", primaryKey: "userId" },
    users: { schema: UsersDoSchema, type: "users", primaryKey: "id" },
  });
  return createStreamDB({
    stream: opts.stream,
    onBatch: opts.onBatch,
    onBeforeBatch: opts.onBeforeBatch,
    state,
    actions: ({ db }) => ({
      upsertPresence: createUpsertStreamAction<TPresenceDo>({ db, helpers: state.presence, collection: db.collections.presence, primaryKey: "userId" }),
      deletePresence: createDeleteStreamAction<TPresenceDo>({ db, helpers: state.presence, collection: db.collections.presence }),
      upsertTyping: createUpsertStreamAction<TTypingDo>({ db, helpers: state.typing, collection: db.collections.typing, primaryKey: "userId" }),
      deleteTyping: createDeleteStreamAction<TTypingDo>({ db, helpers: state.typing, collection: db.collections.typing }),
      upsertUsers: createUpsertStreamAction<TUsersDo>({ db, helpers: state.users, collection: db.collections.users, primaryKey: "id" }),
      deleteUsers: createDeleteStreamAction<TUsersDo>({ db, helpers: state.users, collection: db.collections.users }),
    }),
    live: opts.live ?? DO_MODULE_LIVE["session"],
  });
};

export type TDoModuleActionDefinitions = {
  "session": {
    upsertPresence: ActionDefinition<TPresenceDo>;
    deletePresence: ActionDefinition<string>;
    upsertTyping: ActionDefinition<TTypingDo>;
    deleteTyping: ActionDefinition<string>;
    upsertUsers: ActionDefinition<TUsersDo>;
    deleteUsers: ActionDefinition<string>;
  };
};

const DO_MODULE_DB_FACTORY_IMPL = {
  "session": createSessionStreamDB,
} as const satisfies { [TModule in TDoModuleId]: (opts: CreateDoModuleDbOpts) => unknown; };

export const DO_MODULE_DB_FACTORIES: {
  [TModule in TDoModuleId]: (opts: CreateDoModuleDbOpts) => ReturnType<(typeof DO_MODULE_DB_FACTORY_IMPL)[TModule]>;
} = DO_MODULE_DB_FACTORY_IMPL;
