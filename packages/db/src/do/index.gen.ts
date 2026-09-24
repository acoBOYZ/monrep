// @generated — AUTO-GENERATED FILE. DO NOT EDIT.
//
// Generator : @monrep/codegen (DO schema index)
// Task      : doIndex
// Source    : packages/db/src/do/*.ts
//
// Regenerate: bun run codegen
// Watch     : bun run --cwd packages/codegen watch
//
// Edit instead: DO schema files under packages/db/src/do/

import type { z } from "zod";
import type { TStreamEpoch, TStreamLive } from "./create-do-module.gen";
import __audit_do from "./audit";
import __auth_do from "./auth";
import __testm_do from "./testm";

export type TDoModuleId = "audit" | "auth" | "testm";

export type DoCollectionRow<
  TModule extends TDoModuleId,
  TName extends string,
> =
  TModule extends "audit"
    ? TName extends keyof (typeof __audit_do)["collections"]
      ? z.output<(typeof __audit_do)["collections"][TName]["Schema"]> & object
      : never
  : TModule extends "auth"
    ? TName extends keyof (typeof __auth_do)["collections"]
      ? z.output<(typeof __auth_do)["collections"][TName]["Schema"]> & object
      : never
  : TModule extends "testm"
    ? TName extends keyof (typeof __testm_do)["collections"]
      ? z.output<(typeof __testm_do)["collections"][TName]["Schema"]> & object
      : never
  : never;

export type DoCollectionSchema<
  TModule extends TDoModuleId,
  TName extends string,
> =
  TModule extends "audit"
    ? TName extends keyof (typeof __audit_do)["collections"]
      ? (typeof __audit_do)["collections"][TName]["Schema"]
      : never
  : TModule extends "auth"
    ? TName extends keyof (typeof __auth_do)["collections"]
      ? (typeof __auth_do)["collections"][TName]["Schema"]
      : never
  : TModule extends "testm"
    ? TName extends keyof (typeof __testm_do)["collections"]
      ? (typeof __testm_do)["collections"][TName]["Schema"]
      : never
  : never;

export const SecurityDoSchema = __audit_do.collections.security.Schema;
export const SecurityDoMeta = {
  name: __audit_do.collections.security.name,
  streamModule: __audit_do.moduleId,
  streamEpoch: __audit_do.streamEpoch,
  streamLive: __audit_do.streamLive,
  streamPersist: __audit_do.streamPersist,
  type: __audit_do.collections.security.type,
  primaryKey: __audit_do.collections.security.primaryKey,
  indexes: __audit_do.collections.security.indexes,
} as const;

export const UserDoSchema = __auth_do.collections.user.Schema;
export const UserDoMeta = {
  name: __auth_do.collections.user.name,
  streamModule: __auth_do.moduleId,
  streamEpoch: __auth_do.streamEpoch,
  streamLive: __auth_do.streamLive,
  streamPersist: __auth_do.streamPersist,
  type: __auth_do.collections.user.type,
  primaryKey: __auth_do.collections.user.primaryKey,
  indexes: __auth_do.collections.user.indexes,
} as const;

export const PresenceDoSchema = __testm_do.collections.presence.Schema;
export const PresenceDoMeta = {
  name: __testm_do.collections.presence.name,
  streamModule: __testm_do.moduleId,
  streamEpoch: __testm_do.streamEpoch,
  streamLive: __testm_do.streamLive,
  streamPersist: __testm_do.streamPersist,
  type: __testm_do.collections.presence.type,
  primaryKey: __testm_do.collections.presence.primaryKey,
  indexes: __testm_do.collections.presence.indexes,
} as const;

export const DO_MODULE_EPOCH = {
  "audit": undefined,
  "auth": undefined,
  "testm": undefined,
} as const satisfies Partial<Record<TDoModuleId, TStreamEpoch>>;

export const DO_MODULE_LIVE = {
  "audit": "long-poll",
  "auth": "long-poll",
  "testm": "sse",
} as const satisfies Record<TDoModuleId, TStreamLive>;

export const DO_MODULE_PERSIST: Record<TDoModuleId, boolean> = {
  "audit": false,
  "auth": false,
  "testm": false,
};

export const DO_MODULES = {
  "audit": __audit_do,
  "auth": __auth_do,
  "testm": __testm_do,
} as const;

export const DO_MODULE_STATE = {
  "audit": {
    security: { schema: __audit_do.collections.security.Schema, type: __audit_do.collections.security.type, primaryKey: __audit_do.collections.security.primaryKey },
  },
  "auth": {
    user: { schema: __auth_do.collections.user.Schema, type: __auth_do.collections.user.type, primaryKey: __auth_do.collections.user.primaryKey },
  },
  "testm": {
    presence: { schema: __testm_do.collections.presence.Schema, type: __testm_do.collections.presence.type, primaryKey: __testm_do.collections.presence.primaryKey },
  },
} as const;
