// @generated — AUTO-GENERATED FILE. DO NOT EDIT.
//
// Generator : @monrep/codegen (DO row types)
// Task      : doTypes
// Source    : packages/db/src/do/*.ts
//
// Regenerate: bun run codegen
// Watch     : bun run --cwd packages/codegen watch
//
// Edit instead: DO schema files under packages/db/src/do/

import type { z } from "zod";
import type {
	TDoModuleId,
	MessageDoSchema,
	PresenceDoSchema,
	SecurityDoSchema,
	TypingDoSchema,
	UserDoSchema,
} from "../do";

export type { TDoModuleId };

export type TMessageDo = z.infer<typeof MessageDoSchema>;

export type TPresenceDo = z.infer<typeof PresenceDoSchema>;

export type TSecurityDo = z.infer<typeof SecurityDoSchema>;

export type TTypingDo = z.infer<typeof TypingDoSchema>;

export type TUserDo = z.infer<typeof UserDoSchema>;
