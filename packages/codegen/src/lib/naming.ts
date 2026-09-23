export const pascal = (v: string): string => {
  const parts = v.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[^a-zA-Z0-9]+/g);
  let result = "";
  for (const part of parts) {
    if (!part) continue;
    result += part[0]!.toUpperCase() + part.slice(1).toLowerCase();
  }
  return result;
};

export const camelFromSnake = (table: string): string =>
  table.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

export const routesVarName = (table: string): string => `${camelFromSnake(table)}Routes`;

export const safeId = (v: string): string => {
  const s = v.replace(/[^a-zA-Z0-9_$]/g, "_");
  return /^[a-zA-Z_$]/.test(s) ? s : `_${s}`;
};

export const bindingTypeName = (table: string): string =>
  table
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join("");

export const createReducerName = (table: string, action: "create" | "update" | "delete"): string =>
  `${action}${bindingTypeName(table)}`;

/** Stream file `presence.ts` → default module id `presence-module` when scaffolding / missing prop. */
export const defaultStreamModuleId = (base: string): string => `${base}-module`;
