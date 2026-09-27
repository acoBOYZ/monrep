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
	DeviceCredDoSchema,
	EnrollTokenDoSchema,
	LineDoSchema,
	MessageDoSchema,
	PasskeyDoSchema,
	PresenceDoSchema,
	RuntimeConfigDoSchema,
	SampleDoSchema,
	SecurityDoSchema,
	ServerDoSchema,
	TotpDoSchema,
	TypingDoSchema,
	UserDoSchema,
} from "./do.gen";

export type { TDoModuleId };

export type TDeviceCredDo = z.infer<typeof DeviceCredDoSchema>;

export type TEnrollTokenDo = z.infer<typeof EnrollTokenDoSchema>;

export type TLineDo = z.infer<typeof LineDoSchema>;

export type TMessageDo = z.infer<typeof MessageDoSchema>;

export type TPasskeyDo = z.infer<typeof PasskeyDoSchema>;

export type TPresenceDo = z.infer<typeof PresenceDoSchema>;

export type TRuntimeConfigDo = z.infer<typeof RuntimeConfigDoSchema>;

export type TSampleDo = z.infer<typeof SampleDoSchema>;

export type TSecurityDo = z.infer<typeof SecurityDoSchema>;

export type TServerDo = z.infer<typeof ServerDoSchema>;

export type TTotpDo = z.infer<typeof TotpDoSchema>;

export type TTypingDo = z.infer<typeof TypingDoSchema>;

export type TUserDo = z.infer<typeof UserDoSchema>;
