// @generated: [AUTO-GENERATED] FILE. DO NOT EDIT.
//
// Generator : @monrep/codegen (DO TanStack DB collections)
// Task      : dbCollectionsDo
// Source    : DO modules under packages/main/src/db/do (package main)
//
// Regenerate: bun run codegen [-- --package <name>]
// Watch     : bun run --cwd packages/codegen watch [-- --package <name>]
//
// Edit instead: DO modules under packages/main/src/db/do (package main)

import { BasicIndex } from "@tanstack/react-db";
import {
  createDeleteStreamAction,
  createDoStreamDB,
  createUpsertStreamAction,
} from "@monrep/db/collections";
import { DO_MODULE_LIVE, DO_MODULE_STATE, DO_MODULES } from "./do.gen";
import type { ActionDefinition } from "@durable-streams/state/db";
import type { CreateDoModuleDbOpts } from "@monrep/db/collections";
import type {
	TDoModuleId,
	TMessageDo,
	TPasskeyDo,
	TPresenceDo,
	TSecurityDo,
	TTotpDo,
	TTypingDo,
	TUserDo
} from "./types.gen";

const createAuditStreamDB = (opts: CreateDoModuleDbOpts) => {
  const sdb = createDoStreamDB(DO_MODULE_STATE["audit"], { ...opts, live: opts.live ?? DO_MODULE_LIVE["audit"] }, ({ db, state }) => ({
      upsertSecurity: createUpsertStreamAction({ db, helpers: state.security, collection: db.collections.security, primaryKey: "id", schema: DO_MODULES["audit"].collections.security.Schema, insertGens: DO_MODULES["audit"].collections.security.insertGens, updateGens: DO_MODULES["audit"].collections.security.updateGens }),
      deleteSecurity: createDeleteStreamAction({ db, helpers: state.security, collection: db.collections.security }),
  }));
  sdb.collections.security.createIndex((r) => r.createdAt, { indexType: BasicIndex });
  return sdb;
};

const createAuthStreamDB = (opts: CreateDoModuleDbOpts) => {
  const sdb = createDoStreamDB(DO_MODULE_STATE["auth"], { ...opts, live: opts.live ?? DO_MODULE_LIVE["auth"] }, ({ db, state }) => ({
      upsertPasskey: createUpsertStreamAction({ db, helpers: state.passkey, collection: db.collections.passkey, primaryKey: "id", schema: DO_MODULES["auth"].collections.passkey.Schema, insertGens: DO_MODULES["auth"].collections.passkey.insertGens, updateGens: DO_MODULES["auth"].collections.passkey.updateGens }),
      deletePasskey: createDeleteStreamAction({ db, helpers: state.passkey, collection: db.collections.passkey }),
      upsertTotp: createUpsertStreamAction({ db, helpers: state.totp, collection: db.collections.totp, primaryKey: "userId", schema: DO_MODULES["auth"].collections.totp.Schema, insertGens: DO_MODULES["auth"].collections.totp.insertGens, updateGens: DO_MODULES["auth"].collections.totp.updateGens }),
      deleteTotp: createDeleteStreamAction({ db, helpers: state.totp, collection: db.collections.totp }),
      upsertUser: createUpsertStreamAction({ db, helpers: state.user, collection: db.collections.user, primaryKey: "id", schema: DO_MODULES["auth"].collections.user.Schema, insertGens: DO_MODULES["auth"].collections.user.insertGens, updateGens: DO_MODULES["auth"].collections.user.updateGens }),
      deleteUser: createDeleteStreamAction({ db, helpers: state.user, collection: db.collections.user }),
  }));
  sdb.collections.passkey.createIndex((r) => r.userId, { indexType: BasicIndex });
  sdb.collections.passkey.createIndex((r) => r.credentialId, { indexType: BasicIndex });
  sdb.collections.totp.createIndex((r) => r.userId, { indexType: BasicIndex });
  sdb.collections.user.createIndex((r) => r.email, { indexType: BasicIndex });
  return sdb;
};

const createTestmStreamDB = (opts: CreateDoModuleDbOpts) => {
  const sdb = createDoStreamDB(DO_MODULE_STATE["testm"], { ...opts, live: opts.live ?? DO_MODULE_LIVE["testm"] }, ({ db, state }) => ({
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
    upsertPasskey: ActionDefinition<TPasskeyDo>;
    deletePasskey: ActionDefinition<string>;
    upsertTotp: ActionDefinition<TTotpDo>;
    deleteTotp: ActionDefinition<string>;
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
