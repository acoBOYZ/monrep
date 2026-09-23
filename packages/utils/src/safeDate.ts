/**
 * Convert a date-like value to a safe date.
 * @param value - The date-like value to convert.
 * @returns The safe date, or null if the value is not a valid date.
 */
export const toSafeDate = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
