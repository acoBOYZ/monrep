import { foldTurkishAscii } from "./foldTurkishAscii";

/**
 * Options for slug generation. `slugify` aims to be configurable while keeping sensible defaults.
 */
type SlugifyOptions = {
  /** Character(s) to use when replacing separators/invalid characters. */
  replacement?: string;
  /** Lowercase the final slug. */
  lowercase?: boolean;
  /** Apply Unicode normalization (helps strip accents). */
  normalize?: boolean;
  /** Remove common apostrophes/quotes before processing. */
  removeApostrophes?: boolean;
  /** Maximum length of the slug (after replacements). */
  maxLength?: number;
  /**
   * Trim the replacement character from the start/end.
   * Set to `false` for live-typing UX where trailing dashes should be preserved.
   */
  trim?: boolean;
  /** Collapse repeated replacement characters into a single instance. */
  collapse?: boolean;
  /** Additional characters to allow (added to the default `[a-zA-Z0-9]` set). */
  allow?: string;
  /** Optional fallback if the result becomes empty. */
  fallback?: string;
};

const DEFAULT_ALLOWED = "a-zA-Z0-9";

const escapeForCharClass = (value: string) => value.replace(/[-\\\]^]/g, "\\$&");

const escapeForRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const baseOptions = {
  replacement: "-",
  lowercase: true,
  normalize: true,
  removeApostrophes: true,
  trim: true,
  collapse: true,
  allow: "",
} satisfies Required<Omit<SlugifyOptions, "maxLength" | "fallback">>;

/**
 * Normalize an arbitrary string into a URL-safe slug.
 * Highly configurable; defaults replicate common "slugify" behavior.
 */
export function slugify(raw: string, options: SlugifyOptions = {}): string {
  const opts = { ...baseOptions, ...options };
  const replacement = opts.replacement;
  const replacementEscaped = escapeForRegex(replacement);
  const replacementGroup = `(?:${replacementEscaped})`;
  const allowClass = `${DEFAULT_ALLOWED}${opts.allow ? escapeForCharClass(opts.allow) : ""}`;

  let value = foldTurkishAscii(raw);

  if (opts.normalize) {
    value = value.normalize("NFKD").replace(/\p{M}/gu, "");
  }
  if (opts.removeApostrophes) value = value.replace(/['’]/g, "");

  value = value
    .replace(/\s+/g, replacement) // spaces to replacement
    .replace(new RegExp(`[^${allowClass}]+`, "g"), replacement);

  if (opts.collapse) {
    value = value.replace(new RegExp(`${replacementGroup}{2,}`, "g"), replacement);
  }

  if (opts.trim) {
    value = value.replace(new RegExp(`^${replacementGroup}+|${replacementGroup}+$`, "g"), "");
  }

  if (opts.maxLength && opts.maxLength > 0) {
    value = value.slice(0, opts.maxLength);
  }

  if (opts.lowercase) {
    value = value.toLowerCase();
  }

  if (!value && opts.fallback) {
    value = opts.fallback;
  }

  return value;
}

/**
 * Returns a preconfigured slugifier function. Useful for shared "soft" live-typing transforms.
 */
export const createSlugifier = (defaults: SlugifyOptions = {}) => {
  return (value: string, overrides: SlugifyOptions = {}) =>
    slugify(value, { ...defaults, ...overrides });
};

/**
 * Soft transform for live typing:
 * - lowercase
 * - spaces -> replacement (default '-')
 * - non [a-z0-9-] -> replacement
 * - collapse multiple replacements -> single
 * - DO NOT trim leading/trailing replacements (so typing feels natural)
 * - limit to 48 chars by default
 */
export const slugifySoft = createSlugifier({ trim: false, maxLength: 48 });
