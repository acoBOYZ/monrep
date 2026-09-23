/**
 * Convert a value to an array.
 * @param v - The value to convert.
 * @returns The array.
 */
export const toArray = <T>(v: T | Array<T>): Array<T> => (Array.isArray(v) ? v : [v]);
