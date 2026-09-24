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
import __session_do from "./session";

export type TDoModuleId = "audit" | "session";

export type DoCollectionRow<
  TModule extends TDoModuleId,
  TName extends string,
> =
  TModule extends "audit"
    ? TName extends keyof (typeof __audit_do)["collections"]
      ? z.output<(typeof __audit_do)["collections"][TName]["Schema"]> & object
      : never
  : TModule extends "session"
    ? TName extends keyof (typeof __session_do)["collections"]
      ? z.output<(typeof __session_do)["collections"][TName]["Schema"]> & object
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
  : TModule extends "session"
    ? TName extends keyof (typeof __session_do)["collections"]
      ? (typeof __session_do)["collections"][TName]["Schema"]
      : never
  : never;

export const AuditDoSchema = __audit_do.collections.audit.Schema;
export const AuditDoMeta = {
  name: __audit_do.collections.audit.name,
  streamModule: __audit_do.moduleId,
  streamEpoch: __audit_do.streamEpoch,
  streamLive: __audit_do.streamLive,
  streamPersist: __audit_do.streamPersist,
  type: __audit_do.collections.audit.type,
  primaryKey: __audit_do.collections.audit.primaryKey,
  indexes: __audit_do.collections.audit.indexes,
} as const;

export const UsersDoSchema = __session_do.collections.users.Schema;
export const UsersDoMeta = {
  name: __session_do.collections.users.name,
  streamModule: __session_do.moduleId,
  streamEpoch: __session_do.streamEpoch,
  streamLive: __session_do.streamLive,
  streamPersist: __session_do.streamPersist,
  type: __session_do.collections.users.type,
  primaryKey: __session_do.collections.users.primaryKey,
  indexes: __session_do.collections.users.indexes,
} as const;

export const PresenceDoSchema = __session_do.collections.presence.Schema;
export const PresenceDoMeta = {
  name: __session_do.collections.presence.name,
  streamModule: __session_do.moduleId,
  streamEpoch: __session_do.streamEpoch,
  streamLive: __session_do.streamLive,
  streamPersist: __session_do.streamPersist,
  type: __session_do.collections.presence.type,
  primaryKey: __session_do.collections.presence.primaryKey,
  indexes: __session_do.collections.presence.indexes,
} as const;

export const TypingDoSchema = __session_do.collections.typing.Schema;
export const TypingDoMeta = {
  name: __session_do.collections.typing.name,
  streamModule: __session_do.moduleId,
  streamEpoch: __session_do.streamEpoch,
  streamLive: __session_do.streamLive,
  streamPersist: __session_do.streamPersist,
  type: __session_do.collections.typing.type,
  primaryKey: __session_do.collections.typing.primaryKey,
  indexes: __session_do.collections.typing.indexes,
} as const;

export const DO_MODULE_EPOCH = {
  "audit": undefined,
  "session": undefined,
} as const satisfies Partial<Record<TDoModuleId, TStreamEpoch>>;

export const DO_MODULE_LIVE = {
  "audit": "long-poll",
  "session": "sse",
} as const satisfies Record<TDoModuleId, TStreamLive>;

export const DO_MODULE_PERSIST: Record<TDoModuleId, boolean> = {
  "audit": false,
  "session": false,
};

export const DO_MODULES = {
  "audit": __audit_do,
  "session": __session_do,
} as const;

export const DO_MODULE_STATE = {
  "audit": {
    audit: { schema: __audit_do.collections.audit.Schema, type: __audit_do.collections.audit.type, primaryKey: __audit_do.collections.audit.primaryKey },
  },
  "session": {
    users: { schema: __session_do.collections.users.Schema, type: __session_do.collections.users.type, primaryKey: __session_do.collections.users.primaryKey },
    presence: { schema: __session_do.collections.presence.Schema, type: __session_do.collections.presence.type, primaryKey: __session_do.collections.presence.primaryKey },
    typing: { schema: __session_do.collections.typing.Schema, type: __session_do.collections.typing.type, primaryKey: __session_do.collections.typing.primaryKey },
  },
} as const;
