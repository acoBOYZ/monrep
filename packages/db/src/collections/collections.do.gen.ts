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

import { createDoStreamDB } from "./stream/createDoStreamDB";
import { createDeleteStreamAction, createUpsertStreamAction } from "./stream/streamActionHelpers";
import { DO_MODULES } from "../do";
import type { ActionDefinition } from "@durable-streams/state/db";
import type {
	TDoModuleId,
	TAuditDo,
	TPresenceDo,
	TTypingDo,
	TUsersDo
} from "../types";
import type { CreateDoModuleDbOpts } from "./stream/types";

const createAuditStreamDB = (opts: CreateDoModuleDbOpts) =>
  createDoStreamDB("audit", opts, ({ db, state }) => ({
      upsertAudit: createUpsertStreamAction({ db, helpers: state.audit, collection: db.collections.audit, primaryKey: "id", schema: DO_MODULES["audit"].collections.audit.Schema, insertGens: DO_MODULES["audit"].collections.audit.insertGens, updateGens: DO_MODULES["audit"].collections.audit.updateGens }),
      deleteAudit: createDeleteStreamAction({ db, helpers: state.audit, collection: db.collections.audit }),
  }));

const createSessionStreamDB = (opts: CreateDoModuleDbOpts) =>
  createDoStreamDB("session", opts, ({ db, state }) => ({
      upsertPresence: createUpsertStreamAction({ db, helpers: state.presence, collection: db.collections.presence, primaryKey: "userId", schema: DO_MODULES["session"].collections.presence.Schema, insertGens: DO_MODULES["session"].collections.presence.insertGens, updateGens: DO_MODULES["session"].collections.presence.updateGens }),
      deletePresence: createDeleteStreamAction({ db, helpers: state.presence, collection: db.collections.presence }),
      upsertTyping: createUpsertStreamAction({ db, helpers: state.typing, collection: db.collections.typing, primaryKey: "userId", schema: DO_MODULES["session"].collections.typing.Schema, insertGens: DO_MODULES["session"].collections.typing.insertGens, updateGens: DO_MODULES["session"].collections.typing.updateGens }),
      deleteTyping: createDeleteStreamAction({ db, helpers: state.typing, collection: db.collections.typing }),
      upsertUsers: createUpsertStreamAction({ db, helpers: state.users, collection: db.collections.users, primaryKey: "id", schema: DO_MODULES["session"].collections.users.Schema, insertGens: DO_MODULES["session"].collections.users.insertGens, updateGens: DO_MODULES["session"].collections.users.updateGens }),
      deleteUsers: createDeleteStreamAction({ db, helpers: state.users, collection: db.collections.users }),
  }));

const DO_MODULE_DB_FACTORY_IMPL = {
  "audit": createAuditStreamDB,
  "session": createSessionStreamDB,
} as const satisfies { [TModule in TDoModuleId]: (opts: CreateDoModuleDbOpts) => unknown; };

export const DO_MODULE_DB_FACTORIES: {
  [TModule in TDoModuleId]: (opts: CreateDoModuleDbOpts) => ReturnType<(typeof DO_MODULE_DB_FACTORY_IMPL)[TModule]>;
} = DO_MODULE_DB_FACTORY_IMPL;

export type TDoModuleActionDefinitions = {
  "audit": {
    upsertAudit: ActionDefinition<TAuditDo>;
    deleteAudit: ActionDefinition<string>;
  };
  "session": {
    upsertPresence: ActionDefinition<TPresenceDo>;
    deletePresence: ActionDefinition<string>;
    upsertTyping: ActionDefinition<TTypingDo>;
    deleteTyping: ActionDefinition<string>;
    upsertUsers: ActionDefinition<TUsersDo>;
    deleteUsers: ActionDefinition<string>;
  };
};
