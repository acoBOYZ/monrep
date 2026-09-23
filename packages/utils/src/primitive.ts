export const isPrimitive = (value: unknown): value is string | number | boolean =>
  typeof value === "string" || typeof value === "number" || typeof value === "boolean";

export const primitiveString = (value: unknown, fallback = ""): string =>
  isPrimitive(value) ? String(value) : fallback;

export const unknownString = (value: unknown): string =>
  isPrimitive(value) ? String(value) : JSON.stringify(value);
