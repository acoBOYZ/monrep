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
	TDeviceCredDo,
	TEnrollTokenDo,
	TPasskeyDo,
	TRuntimeConfigDo,
	TSecurityDo,
	TServerDo,
	TTotpDo,
	TUserDo
} from "./types.gen";

const createAgentStreamDB = (opts: CreateDoModuleDbOpts) => {
  const sdb = createDoStreamDB(DO_MODULE_STATE["agent"], { ...opts, live: opts.live ?? DO_MODULE_LIVE["agent"] }, ({ db, state }) => ({
      upsertDeviceCred: createUpsertStreamAction({ db, helpers: state.device_cred, collection: db.collections.device_cred, primaryKey: "serverId", schema: DO_MODULES["agent"].collections.device_cred.Schema, insertGens: DO_MODULES["agent"].collections.device_cred.insertGens, updateGens: DO_MODULES["agent"].collections.device_cred.updateGens }),
      deleteDeviceCred: createDeleteStreamAction({ db, helpers: state.device_cred, collection: db.collections.device_cred }),
      upsertEnrollToken: createUpsertStreamAction({ db, helpers: state.enroll_token, collection: db.collections.enroll_token, primaryKey: "id", schema: DO_MODULES["agent"].collections.enroll_token.Schema, insertGens: DO_MODULES["agent"].collections.enroll_token.insertGens, updateGens: DO_MODULES["agent"].collections.enroll_token.updateGens }),
      deleteEnrollToken: createDeleteStreamAction({ db, helpers: state.enroll_token, collection: db.collections.enroll_token }),
      upsertRuntimeConfig: createUpsertStreamAction({ db, helpers: state.runtime_config, collection: db.collections.runtime_config, primaryKey: "serverId", schema: DO_MODULES["agent"].collections.runtime_config.Schema, insertGens: DO_MODULES["agent"].collections.runtime_config.insertGens, updateGens: DO_MODULES["agent"].collections.runtime_config.updateGens }),
      deleteRuntimeConfig: createDeleteStreamAction({ db, helpers: state.runtime_config, collection: db.collections.runtime_config }),
      upsertServer: createUpsertStreamAction({ db, helpers: state.server, collection: db.collections.server, primaryKey: "id", schema: DO_MODULES["agent"].collections.server.Schema, insertGens: DO_MODULES["agent"].collections.server.insertGens, updateGens: DO_MODULES["agent"].collections.server.updateGens }),
      deleteServer: createDeleteStreamAction({ db, helpers: state.server, collection: db.collections.server }),
  }));
  sdb.collections.device_cred.createIndex((r) => r.serverId, { indexType: BasicIndex });
  sdb.collections.device_cred.createIndex((r) => r.deviceId, { indexType: BasicIndex });
  sdb.collections.enroll_token.createIndex((r) => r.serverId, { indexType: BasicIndex });
  sdb.collections.enroll_token.createIndex((r) => r.expiresAt, { indexType: BasicIndex });
  sdb.collections.enroll_token.createIndex((r) => r.tokenHash, { indexType: BasicIndex });
  sdb.collections.runtime_config.createIndex((r) => r.serverId, { indexType: BasicIndex });
  sdb.collections.server.createIndex((r) => r.status, { indexType: BasicIndex });
  sdb.collections.server.createIndex((r) => r.deviceId, { indexType: BasicIndex });
  sdb.collections.server.createIndex((r) => r.createdAt, { indexType: BasicIndex });
  return sdb;
};

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

const DO_MODULE_DB_FACTORY_IMPL = {
  "agent": createAgentStreamDB,
  "audit": createAuditStreamDB,
  "auth": createAuthStreamDB,
}

export const DO_MODULE_DB_FACTORIES: {
  [TModule in TDoModuleId]: (opts: CreateDoModuleDbOpts) => ReturnType<(typeof DO_MODULE_DB_FACTORY_IMPL)[TModule]>;
} = DO_MODULE_DB_FACTORY_IMPL;

export type TDoModuleActionDefinitions = {
  "agent": {
    upsertDeviceCred: ActionDefinition<TDeviceCredDo | Array<TDeviceCredDo>>;
    deleteDeviceCred: ActionDefinition<string | Array<string>>;
    upsertEnrollToken: ActionDefinition<TEnrollTokenDo | Array<TEnrollTokenDo>>;
    deleteEnrollToken: ActionDefinition<string | Array<string>>;
    upsertRuntimeConfig: ActionDefinition<TRuntimeConfigDo | Array<TRuntimeConfigDo>>;
    deleteRuntimeConfig: ActionDefinition<string | Array<string>>;
    upsertServer: ActionDefinition<TServerDo | Array<TServerDo>>;
    deleteServer: ActionDefinition<string | Array<string>>;
  };
  "audit": {
    upsertSecurity: ActionDefinition<TSecurityDo | Array<TSecurityDo>>;
    deleteSecurity: ActionDefinition<string | Array<string>>;
  };
  "auth": {
    upsertPasskey: ActionDefinition<TPasskeyDo | Array<TPasskeyDo>>;
    deletePasskey: ActionDefinition<string | Array<string>>;
    upsertTotp: ActionDefinition<TTotpDo | Array<TTotpDo>>;
    deleteTotp: ActionDefinition<string | Array<string>>;
    upsertUser: ActionDefinition<TUserDo | Array<TUserDo>>;
    deleteUser: ActionDefinition<string | Array<string>>;
  };
};
