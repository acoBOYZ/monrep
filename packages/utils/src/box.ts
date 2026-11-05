export type Box<T> = { current: T };

/** Widen primitive literals so `box(false)` is `Box<boolean>`, not `Box<false>`. */
type MutableCellValue<T> = T extends boolean
  ? boolean
  : T extends number
    ? number
    : T extends string
      ? string
      : T;

/**
 * Mutable cell for effect / async locals.
 *
 * Prefer this over `let` reassignment so React Compiler can optimize the
 * surrounding component or hook (`react(immutability)`).
 *
 * Same runtime shape as a ref; not a hook — create inside effects/callbacks.
 *
 * For `setInterval` / `setTimeout` ids, prefer a plain `{ current }` literal
 * instead: react-doctor only tracks timer cleanup through object literals.
 */
export function box<T>(initial: T): Box<MutableCellValue<T>> {
  return { current: initial as MutableCellValue<T> };
}

/** Define several sibling cells in one place (2+ locals in the same scope). */
export function boxes<T extends Record<string, unknown>>(
  initials: T,
): { [K in keyof T]: Box<MutableCellValue<T[K]>> } {
  const out = {} as { [K in keyof T]: Box<MutableCellValue<T[K]>> };
  for (const key of Object.keys(initials) as Array<keyof T>) {
    out[key] = box(initials[key]);
  }
  return out;
}
