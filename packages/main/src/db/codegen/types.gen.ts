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
	PasskeyDoSchema,
	RuntimeConfigDoSchema,
	SecurityDoSchema,
	ServerDoSchema,
	ServerLayoutDoSchema,
	TotpDoSchema,
	UserDoSchema,
} from "./do.gen";

export type { TDoModuleId };
export type TDeviceCredDo = z.infer<typeof DeviceCredDoSchema>;
export type TEnrollTokenDo = z.infer<typeof EnrollTokenDoSchema>;
export type TPasskeyDo = z.infer<typeof PasskeyDoSchema>;
export type TRuntimeConfigDo = z.infer<typeof RuntimeConfigDoSchema>;
export type TSecurityDo = z.infer<typeof SecurityDoSchema>;
export type TServerDo = z.infer<typeof ServerDoSchema>;
export type TServerLayoutDo = z.infer<typeof ServerLayoutDoSchema>;
export type TTotpDo = z.infer<typeof TotpDoSchema>;
export type TUserDo = z.infer<typeof UserDoSchema>;
