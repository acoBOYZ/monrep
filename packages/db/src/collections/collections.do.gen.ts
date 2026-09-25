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

import { BasicIndex } from "@tanstack/react-db";
import { DO_MODULES } from "../do";
import { createDoStreamDB } from "./stream/createDoStreamDB";
import { createDeleteStreamAction, createUpsertStreamAction } from "./stream/streamActionHelpers";
import type { ActionDefinition } from "@durable-streams/state/db";
import type {
	TDoModuleId,
	TMessageDo,
	TPresenceDo,
	TSecurityDo,
	TTypingDo,
	TUserDo
} from "../types";
import type { CreateDoModuleDbOpts } from "./stream/types";

const createAuditStreamDB = (opts: CreateDoModuleDbOpts) => {
  const sdb = createDoStreamDB("audit", opts, ({ db, state }) => ({
      upsertSecurity: createUpsertStreamAction({ db, helpers: state.security, collection: db.collections.security, primaryKey: "id", schema: DO_MODULES["audit"].collections.security.Schema, insertGens: DO_MODULES["audit"].collections.security.insertGens, updateGens: DO_MODULES["audit"].collections.security.updateGens }),
      deleteSecurity: createDeleteStreamAction({ db, helpers: state.security, collection: db.collections.security }),
  }));
  sdb.collections.security.createIndex((r) => r.createdAt, { indexType: BasicIndex });
  return sdb;
};

const createAuthStreamDB = (opts: CreateDoModuleDbOpts) => {
  const sdb = createDoStreamDB("auth", opts, ({ db, state }) => ({
      upsertUser: createUpsertStreamAction({ db, helpers: state.user, collection: db.collections.user, primaryKey: "id", schema: DO_MODULES["auth"].collections.user.Schema, insertGens: DO_MODULES["auth"].collections.user.insertGens, updateGens: DO_MODULES["auth"].collections.user.updateGens }),
      deleteUser: createDeleteStreamAction({ db, helpers: state.user, collection: db.collections.user }),
  }));
  sdb.collections.user.createIndex((r) => r.email, { indexType: BasicIndex });
  return sdb;
};

const createTestmStreamDB = (opts: CreateDoModuleDbOpts) => {
  const sdb = createDoStreamDB("testm", opts, ({ db, state }) => ({
      upsertMessage: createUpsertStreamAction({ db, helpers: state.message, collection: db.collections.message, primaryKey: "id", schema: DO_MODULES["testm"].collections.message.Schema, insertGens: DO_MODULES["testm"].collections.message.insertGens, updateGens: DO_MODULES["testm"].collections.message.updateGens }),
      deleteMessage: createDeleteStreamAction({ db, helpers: state.message, collection: db.collections.message }),
      upsertPresence: createUpsertStreamAction({ db, helpers: state.presence, collection: db.collections.presence, primaryKey: "userId", schema: DO_MODULES["testm"].collections.presence.Schema, insertGens: DO_MODULES["testm"].collections.presence.insertGens, updateGens: DO_MODULES["testm"].collections.presence.updateGens }),
      deletePresence: createDeleteStreamAction({ db, helpers: state.presence, collection: db.collections.presence }),
      upsertTyping: createUpsertStreamAction({ db, helpers: state.typing, collection: db.collections.typing, primaryKey: "userId", schema: DO_MODULES["testm"].collections.typing.Schema, insertGens: DO_MODULES["testm"].collections.typing.insertGens, updateGens: DO_MODULES["testm"].collections.typing.updateGens }),
      deleteTyping: createDeleteStreamAction({ db, helpers: state.typing, collection: db.collections.typing }),
  }));
  sdb.collections.message.createIndex((r) => r.createdAt, { indexType: BasicIndex });
  sdb.collections.message.createIndex((r) => r.id, { indexType: BasicIndex });
  sdb.collections.presence.createIndex((r) => r.userId, { indexType: BasicIndex });
  sdb.collections.typing.createIndex((r) => r.userId, { indexType: BasicIndex });
  return sdb;
};

const DO_MODULE_DB_FACTORY_IMPL = {
  "audit": createAuditStreamDB,
  "auth": createAuthStreamDB,
  "testm": createTestmStreamDB,
}

export const DO_MODULE_DB_FACTORIES: {
  [TModule in TDoModuleId]: (opts: CreateDoModuleDbOpts) => ReturnType<(typeof DO_MODULE_DB_FACTORY_IMPL)[TModule]>;
} = DO_MODULE_DB_FACTORY_IMPL;

export type TDoModuleActionDefinitions = {
  "audit": {
    upsertSecurity: ActionDefinition<TSecurityDo>;
    deleteSecurity: ActionDefinition<string>;
  };
  "auth": {
    upsertUser: ActionDefinition<TUserDo>;
    deleteUser: ActionDefinition<string>;
  };
  "testm": {
    upsertMessage: ActionDefinition<TMessageDo>;
    deleteMessage: ActionDefinition<string>;
    upsertPresence: ActionDefinition<TPresenceDo>;
    deletePresence: ActionDefinition<string>;
    upsertTyping: ActionDefinition<TTypingDo>;
    deleteTyping: ActionDefinition<string>;
  };
};
