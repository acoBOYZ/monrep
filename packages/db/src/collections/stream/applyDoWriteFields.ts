/** True when a write-default may fill this field (caller left it unset). */
export const isDoWriteFieldUnset = (value: unknown): boolean =>
  value === undefined || value === null || value === "";

export type DoWriteFieldGens = Partial<Record<string, () => unknown>>;

/**
 * Middleware body for DO upsert defaults — mutates `row` in place.
 * Future CLI/RPC pre-middleware should call this same helper.
 */
export const applyDoWriteFields = <TValue extends object>(
  row: TValue,
  gens: DoWriteFieldGens | null | undefined,
): void => {
  if (!gens) return;
  const rec = row as Record<string, unknown>;
  for (const key of Object.keys(gens)) {
    const gen = gens[key];
    if (!gen) continue;
    if (!isDoWriteFieldUnset(rec[key])) continue;
    rec[key] = gen();
  }
};
