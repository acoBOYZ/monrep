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

import { doCollection } from "./stream/doCollection";
import { createDoStreamDB } from "./stream/createDoStreamDB";
import { materializeDoOne } from "./stream/materializeDoOne";
import { createDeleteStreamAction, createUpsertStreamAction } from "./stream/streamActionHelpers";
import type { ActionDefinition } from "@durable-streams/state/db";
import type { DbClient } from "@tanstack/react-db";
import type {
	TDoModuleId,
	TPresenceDo,
	TTypingDo,
	TUsersDo
} from "../types";
import type { CreateDoModuleDbOpts, DoStreamDb } from "./stream/types";

export const sessionPresenceCollection = doCollection("session", "presence");
export const sessionTypingCollection = doCollection("session", "typing");
export const sessionUsersCollection = doCollection("session", "users");

const createSessionStreamDB = (opts: CreateDoModuleDbOpts) =>
  createDoStreamDB("session", opts, ({ db, state }) => ({
      upsertPresence: createUpsertStreamAction({ db, helpers: state.presence, collection: db.collections.presence, primaryKey: "userId" }),
      deletePresence: createDeleteStreamAction({ db, helpers: state.presence, collection: db.collections.presence }),
      upsertTyping: createUpsertStreamAction({ db, helpers: state.typing, collection: db.collections.typing, primaryKey: "userId" }),
      deleteTyping: createDeleteStreamAction({ db, helpers: state.typing, collection: db.collections.typing }),
      upsertUsers: createUpsertStreamAction({ db, helpers: state.users, collection: db.collections.users, primaryKey: "id" }),
      deleteUsers: createDeleteStreamAction({ db, helpers: state.users, collection: db.collections.users }),
  }));

const DO_MODULE_DB_FACTORY_IMPL = {
  "session": createSessionStreamDB,
} as const satisfies { [TModule in TDoModuleId]: (opts: CreateDoModuleDbOpts) => unknown; };

export const DO_MODULE_DB_FACTORIES: {
  [TModule in TDoModuleId]: (opts: CreateDoModuleDbOpts) => ReturnType<(typeof DO_MODULE_DB_FACTORY_IMPL)[TModule]>;
} = DO_MODULE_DB_FACTORY_IMPL;

export async function materializeDoCollection(
  dbClient: DbClient,
  options: AnyDoCollectionOptions,
  ensure: <TModule extends TDoModuleId>(moduleId: TModule) => Promise<DoStreamDb<TModule>>,
): Promise<void> {
  switch (options.id) {
    case sessionPresenceCollection.id: return materializeDoOne(dbClient, sessionPresenceCollection, ensure, "session", (db) => db.collections.presence);
    case sessionTypingCollection.id: return materializeDoOne(dbClient, sessionTypingCollection, ensure, "session", (db) => db.collections.typing);
    case sessionUsersCollection.id: return materializeDoOne(dbClient, sessionUsersCollection, ensure, "session", (db) => db.collections.users);
  }
}

export const DO_COLLECTION_OPTIONS = {
  "session": {
    presence: sessionPresenceCollection,
    typing: sessionTypingCollection,
    users: sessionUsersCollection,
  },
} as const;

export type TDoCollectionOptions = typeof DO_COLLECTION_OPTIONS;

export type AnyDoCollectionOptions =
  | typeof sessionPresenceCollection
  | typeof sessionTypingCollection
  | typeof sessionUsersCollection;

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
