// @generated: [AUTO-GENERATED] FILE. DO NOT EDIT.
//
// Generator : @monrep/codegen (DO schema index)
// Task      : doIndex
// Source    : DO modules under packages/main/src/db/do (package main)
//
// Regenerate: bun run codegen [-- --package <name>]
// Watch     : bun run --cwd packages/codegen watch [-- --package <name>]
//
// Edit instead: DO modules under packages/main/src/db/do (package main)

import type { z } from "zod";
import type { TStreamEpoch, TStreamLive } from "@monrep/db/module";
import __audit_do from "../do/audit";
import __auth_do from "../do/auth";
import __testm_do from "../do/testm";

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
  type: __audit_do.collections.security.name,
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
  type: __auth_do.collections.user.name,
  primaryKey: __auth_do.collections.user.primaryKey,
  indexes: __auth_do.collections.user.indexes,
} as const;

export const TotpDoSchema = __auth_do.collections.totp.Schema;
export const TotpDoMeta = {
  name: __auth_do.collections.totp.name,
  streamModule: __auth_do.moduleId,
  streamEpoch: __auth_do.streamEpoch,
  streamLive: __auth_do.streamLive,
  streamPersist: __auth_do.streamPersist,
  type: __auth_do.collections.totp.name,
  primaryKey: __auth_do.collections.totp.primaryKey,
  indexes: __auth_do.collections.totp.indexes,
} as const;

export const PasskeyDoSchema = __auth_do.collections.passkey.Schema;
export const PasskeyDoMeta = {
  name: __auth_do.collections.passkey.name,
  streamModule: __auth_do.moduleId,
  streamEpoch: __auth_do.streamEpoch,
  streamLive: __auth_do.streamLive,
  streamPersist: __auth_do.streamPersist,
  type: __auth_do.collections.passkey.name,
  primaryKey: __auth_do.collections.passkey.primaryKey,
  indexes: __auth_do.collections.passkey.indexes,
} as const;

export const PresenceDoSchema = __testm_do.collections.presence.Schema;
export const PresenceDoMeta = {
  name: __testm_do.collections.presence.name,
  streamModule: __testm_do.moduleId,
  streamEpoch: __testm_do.streamEpoch,
  streamLive: __testm_do.streamLive,
  streamPersist: __testm_do.streamPersist,
  type: __testm_do.collections.presence.name,
  primaryKey: __testm_do.collections.presence.primaryKey,
  indexes: __testm_do.collections.presence.indexes,
} as const;

export const MessageDoSchema = __testm_do.collections.message.Schema;
export const MessageDoMeta = {
  name: __testm_do.collections.message.name,
  streamModule: __testm_do.moduleId,
  streamEpoch: __testm_do.streamEpoch,
  streamLive: __testm_do.streamLive,
  streamPersist: __testm_do.streamPersist,
  type: __testm_do.collections.message.name,
  primaryKey: __testm_do.collections.message.primaryKey,
  indexes: __testm_do.collections.message.indexes,
} as const;

export const TypingDoSchema = __testm_do.collections.typing.Schema;
export const TypingDoMeta = {
  name: __testm_do.collections.typing.name,
  streamModule: __testm_do.moduleId,
  streamEpoch: __testm_do.streamEpoch,
  streamLive: __testm_do.streamLive,
  streamPersist: __testm_do.streamPersist,
  type: __testm_do.collections.typing.name,
  primaryKey: __testm_do.collections.typing.primaryKey,
  indexes: __testm_do.collections.typing.indexes,
} as const;

export const DO_MODULE_EPOCH = {
  "audit": undefined,
  "auth": undefined,
  "testm": "utc-hour",
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
    security: { 
      schema: __audit_do.collections.security.Schema, 
      type: __audit_do.collections.security.name, 
      primaryKey: __audit_do.collections.security.primaryKey 
    },
  },
  "auth": {
    user: { 
      schema: __auth_do.collections.user.Schema, 
      type: __auth_do.collections.user.name, 
      primaryKey: __auth_do.collections.user.primaryKey 
    },
    totp: { 
      schema: __auth_do.collections.totp.Schema, 
      type: __auth_do.collections.totp.name, 
      primaryKey: __auth_do.collections.totp.primaryKey 
    },
    passkey: { 
      schema: __auth_do.collections.passkey.Schema, 
      type: __auth_do.collections.passkey.name, 
      primaryKey: __auth_do.collections.passkey.primaryKey 
    },
  },
  "testm": {
    presence: { 
      schema: __testm_do.collections.presence.Schema, 
      type: __testm_do.collections.presence.name, 
      primaryKey: __testm_do.collections.presence.primaryKey 
    },
    message: { 
      schema: __testm_do.collections.message.Schema, 
      type: __testm_do.collections.message.name, 
      primaryKey: __testm_do.collections.message.primaryKey 
    },
    typing: { 
      schema: __testm_do.collections.typing.Schema, 
      type: __testm_do.collections.typing.name, 
      primaryKey: __testm_do.collections.typing.primaryKey 
    },
  },
} as const;
