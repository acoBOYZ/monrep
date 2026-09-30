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
import __agent_do from "../do/agent";
import __audit_do from "../do/audit";
import __auth_do from "../do/auth";

export type TDoModuleId = "agent" | "audit" | "auth";

export type DoCollectionRow<
  TModule extends TDoModuleId,
  TName extends string,
> =
  TModule extends "agent"
    ? TName extends keyof (typeof __agent_do)["collections"]
      ? z.output<(typeof __agent_do)["collections"][TName]["Schema"]> & object
      : never
  : TModule extends "audit"
    ? TName extends keyof (typeof __audit_do)["collections"]
      ? z.output<(typeof __audit_do)["collections"][TName]["Schema"]> & object
      : never
  : TModule extends "auth"
    ? TName extends keyof (typeof __auth_do)["collections"]
      ? z.output<(typeof __auth_do)["collections"][TName]["Schema"]> & object
      : never
  : never;

export type DoCollectionSchema<
  TModule extends TDoModuleId,
  TName extends string,
> =
  TModule extends "agent"
    ? TName extends keyof (typeof __agent_do)["collections"]
      ? (typeof __agent_do)["collections"][TName]["Schema"]
      : never
  : TModule extends "audit"
    ? TName extends keyof (typeof __audit_do)["collections"]
      ? (typeof __audit_do)["collections"][TName]["Schema"]
      : never
  : TModule extends "auth"
    ? TName extends keyof (typeof __auth_do)["collections"]
      ? (typeof __auth_do)["collections"][TName]["Schema"]
      : never
  : never;

export const ServerDoSchema = __agent_do.collections.server.Schema;
export const ServerDoMeta = {
  name: __agent_do.collections.server.name,
  streamModule: __agent_do.moduleId,
  streamEpoch: __agent_do.streamEpoch,
  streamLive: __agent_do.streamLive,
  streamPersist: __agent_do.streamPersist,
  type: __agent_do.collections.server.name,
  primaryKey: __agent_do.collections.server.primaryKey,
  indexes: __agent_do.collections.server.indexes,
} as const;

export const EnrollTokenDoSchema = __agent_do.collections.enroll_token.Schema;
export const EnrollTokenDoMeta = {
  name: __agent_do.collections.enroll_token.name,
  streamModule: __agent_do.moduleId,
  streamEpoch: __agent_do.streamEpoch,
  streamLive: __agent_do.streamLive,
  streamPersist: __agent_do.streamPersist,
  type: __agent_do.collections.enroll_token.name,
  primaryKey: __agent_do.collections.enroll_token.primaryKey,
  indexes: __agent_do.collections.enroll_token.indexes,
} as const;

export const DeviceCredDoSchema = __agent_do.collections.device_cred.Schema;
export const DeviceCredDoMeta = {
  name: __agent_do.collections.device_cred.name,
  streamModule: __agent_do.moduleId,
  streamEpoch: __agent_do.streamEpoch,
  streamLive: __agent_do.streamLive,
  streamPersist: __agent_do.streamPersist,
  type: __agent_do.collections.device_cred.name,
  primaryKey: __agent_do.collections.device_cred.primaryKey,
  indexes: __agent_do.collections.device_cred.indexes,
} as const;

export const RuntimeConfigDoSchema = __agent_do.collections.runtime_config.Schema;
export const RuntimeConfigDoMeta = {
  name: __agent_do.collections.runtime_config.name,
  streamModule: __agent_do.moduleId,
  streamEpoch: __agent_do.streamEpoch,
  streamLive: __agent_do.streamLive,
  streamPersist: __agent_do.streamPersist,
  type: __agent_do.collections.runtime_config.name,
  primaryKey: __agent_do.collections.runtime_config.primaryKey,
  indexes: __agent_do.collections.runtime_config.indexes,
} as const;

export const ServerLayoutDoSchema = __agent_do.collections.server_layout.Schema;
export const ServerLayoutDoMeta = {
  name: __agent_do.collections.server_layout.name,
  streamModule: __agent_do.moduleId,
  streamEpoch: __agent_do.streamEpoch,
  streamLive: __agent_do.streamLive,
  streamPersist: __agent_do.streamPersist,
  type: __agent_do.collections.server_layout.name,
  primaryKey: __agent_do.collections.server_layout.primaryKey,
  indexes: __agent_do.collections.server_layout.indexes,
} as const;

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

export const DO_MODULE_EPOCH = {
  "agent": undefined,
  "audit": undefined,
  "auth": undefined,
} as const satisfies Partial<Record<TDoModuleId, TStreamEpoch>>;

export const DO_MODULE_LIVE = {
  "agent": "long-poll",
  "audit": "long-poll",
  "auth": "long-poll",
} as const satisfies Record<TDoModuleId, TStreamLive>;

export const DO_MODULE_PERSIST: Record<TDoModuleId, boolean> = {
  "agent": false,
  "audit": false,
  "auth": false,
};

export const DO_MODULES = {
  "agent": __agent_do,
  "audit": __audit_do,
  "auth": __auth_do,
} as const;

export const DO_MODULE_STATE = {
  "agent": {
    server: { 
      schema: __agent_do.collections.server.Schema, 
      type: __agent_do.collections.server.name, 
      primaryKey: __agent_do.collections.server.primaryKey 
    },
    enroll_token: { 
      schema: __agent_do.collections.enroll_token.Schema, 
      type: __agent_do.collections.enroll_token.name, 
      primaryKey: __agent_do.collections.enroll_token.primaryKey 
    },
    device_cred: { 
      schema: __agent_do.collections.device_cred.Schema, 
      type: __agent_do.collections.device_cred.name, 
      primaryKey: __agent_do.collections.device_cred.primaryKey 
    },
    runtime_config: { 
      schema: __agent_do.collections.runtime_config.Schema, 
      type: __agent_do.collections.runtime_config.name, 
      primaryKey: __agent_do.collections.runtime_config.primaryKey 
    },
    server_layout: { 
      schema: __agent_do.collections.server_layout.Schema, 
      type: __agent_do.collections.server_layout.name, 
      primaryKey: __agent_do.collections.server_layout.primaryKey 
    },
  },
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
} as const;
