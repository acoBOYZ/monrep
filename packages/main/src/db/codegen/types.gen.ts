// @generated: [AUTO-GENERATED] FILE. DO NOT EDIT.
//
// Generator : @monrep/codegen (DO row types)
// Task      : doTypes
// Source    : DO modules under packages/main/src/db/do (package main)
//
// Regenerate: bun run codegen [-- --package <name>]
// Watch     : bun run --cwd packages/codegen watch [-- --package <name>]
//
// Edit instead: DO modules under packages/main/src/db/do (package main)

import type { z } from "zod";
import type {
	TDoModuleId,
	MessageDoSchema,
	PresenceDoSchema,
	SecurityDoSchema,
	TypingDoSchema,
	UserDoSchema,
} from "./do.gen";

export type { TDoModuleId };

export type TMessageDo = z.infer<typeof MessageDoSchema>;

export type TPresenceDo = z.infer<typeof PresenceDoSchema>;

export type TSecurityDo = z.infer<typeof SecurityDoSchema>;

export type TTypingDo = z.infer<typeof TypingDoSchema>;

export type TUserDo = z.infer<typeof UserDoSchema>;
