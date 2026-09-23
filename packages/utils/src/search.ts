import { foldTurkishAscii } from "./foldTurkishAscii";

/**
 * Shared search helpers. Two stacks — pick one and stay on it:
 *
 * Live query (`useLiveQuery` / `ilike`):
 *   `parseSearchTerms(raw)` then `searchIlikePatterns(term)` per term.
 *   AND across terms, OR across fields. Do not use `buildSearchTerms` here.
 *   Web list filters: `liveSearchWhere` in `apps/web/src/lib/live-search.ts`.
 *
 * In-memory (`Array.filter`):
 *   `buildSearchTerms(raw)` then `includesAnySearchTerm` or `includesFlexibleSearchTerm`.
 *   `includesFlexibleSearchTerm` (subsequence) cannot be expressed as `ILIKE`.
 */

/** Default gate: trimmed query must be at least this long before search runs. */
export const SEARCH_QUERY_MIN_CHARS = 2;

/** Sidebar / short live search: a single character is enough. */
export const SHORT_SEARCH_MIN_CHARS = 1;

const ILIKE_PATTERN_CAP = 32;
const TR_I_DOT_MAX = 3;
const TR_I_DOT = new Set(["i", "ı", "I", "İ"]);

/**
 * Latin-first fold for Turkish-aware client matching.
 * Lowercases with `tr-TR`, maps ğüşöçı to ascii, collapses whitespace.
 * Not a general i18n normalizer — use only as a search fold.
 *
 * @example
 * normalizeSearchText("  Kübra  ") // "kubra"
 */
export function normalizeSearchText(value: string): string {
  return foldTurkishAscii(value.trim().toLocaleLowerCase("tr-TR")).replace(/\s+/g, " ");
}

function isSubsequenceMatch(query: string, source: string): boolean {
  if (!query.length) return true;
  let cursor = 0;
  for (const char of source) {
    if (char !== query[cursor]) continue;
    cursor += 1;
    if (cursor >= query.length) return true;
  }
  return false;
}

/** Escape `%` and `\` for use inside SQL `ILIKE '%…%'` patterns. */
const escapeForIlikeContains = (raw: string) => raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%");

/**
 * Whether a free-text query is long enough to search.
 * Default min is {@link SEARCH_QUERY_MIN_CHARS} (2). Pass
 * {@link SHORT_SEARCH_MIN_CHARS} for single-character live search.
 *
 * @example
 * isSearchQueryActive("a")     // false
 * isSearchQueryActive("ab")    // true
 * isSearchQueryActive("a", 1)  // true
 */
export function isSearchQueryActive(
  raw: string,
  minChars: number = SEARCH_QUERY_MIN_CHARS,
): boolean {
  return raw.trim().length >= minChars;
}

const pushIlikeContainsPattern = (out: Array<string>, seen: Set<string>, value: string) => {
  const pat = `%${escapeForIlikeContains(value)}%`;
  if (seen.has(pat)) return;
  seen.add(pat);
  out.push(pat);
};

/**
 * `ILIKE '%…%'` variants for one search token (NFC, NFD, tr-TR lower, ascii fold,
 * and `i/ı/I/İ` permutations capped at 3 dots / 32 patterns).
 *
 * ILIKE is already case-insensitive — do not emit extra uppercase forms
 * (e.g. `KÜB`); some query layers mishandle those code points.
 *
 * Empty when `raw.trim().length < minChars`. Default min is
 * {@link SEARCH_QUERY_MIN_CHARS}; use {@link SHORT_SEARCH_MIN_CHARS} for
 * sidebar-style live search.
 *
 * Use with `parseSearchTerms` in a live `where` (`ilike`). Not for in-memory filters.
 *
 * @example
 * searchIlikePatterns("kü")        // min 2 — several `%kü%` / `%ku%` variants
 * searchIlikePatterns("k", 1)      // short search — includes `%k%`
 */
export function searchIlikePatterns(
  raw: string,
  minChars: number = SEARCH_QUERY_MIN_CHARS,
): Array<string> {
  const t = raw.normalize("NFC").trim();
  if (t.length < minChars) return [];

  const out: Array<string> = [];
  const seen = new Set<string>();

  pushIlikeContainsPattern(out, seen, t);
  const nfd = t.normalize("NFD");
  if (nfd !== t) {
    pushIlikeContainsPattern(out, seen, nfd);
  }

  try {
    pushIlikeContainsPattern(out, seen, t.toLocaleLowerCase("tr-TR"));
  } catch {
    pushIlikeContainsPattern(out, seen, t.toLowerCase());
  }

  pushIlikeContainsPattern(out, seen, normalizeSearchText(t));

  const idxs: Array<number> = [];
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch !== undefined && TR_I_DOT.has(ch)) idxs.push(i);
  }
  const capped = idxs.slice(0, TR_I_DOT_MAX);
  const chars = t.split("");
  const dfs = (depth: number) => {
    if (out.length >= ILIKE_PATTERN_CAP) return;
    if (depth >= capped.length) {
      pushIlikeContainsPattern(out, seen, chars.join(""));
      return;
    }
    const p = capped[depth];
    if (p === undefined) return;
    const save = chars[p];
    if (save === undefined) return;
    for (const rep of ["i", "ı", "I", "İ"] as const) {
      chars[p] = rep;
      dfs(depth + 1);
      if (out.length >= ILIKE_PATTERN_CAP) return;
    }
    chars[p] = save;
  };
  dfs(0);

  return out;
}

/**
 * Split free text into AND terms for live queries.
 * Quoted segments (`"Account 1 X"`) stay one term; the rest split on spaces.
 * Does not inject the full phrase as an extra term and does not TR-fold —
 * fold each term with `searchIlikePatterns`.
 *
 * Not a substitute for `buildSearchTerms` (in-memory).
 *
 * @example
 * parseSearchTerms(`foo "bar baz"`) // ["foo", "bar baz"]
 */
export function parseSearchTerms(raw: string): Array<string> {
  const normalized = raw.normalize("NFC").trim().replace(/\s+/g, " ");
  if (!normalized) return [];

  const terms: Array<string> = [];
  const re = /"([^"]+)"|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(normalized)) !== null) {
    const term = (match[1] || match[2] || "").trim();
    if (term) terms.push(term);
  }
  return terms;
}

/**
 * In-memory term list: TR-fold the whole query, then `[fullPhrase, ...words]`
 * (deduped). Use with `includesAnySearchTerm` / `includesFlexibleSearchTerm`.
 *
 * Not for live `ilike` — use `parseSearchTerms` + `searchIlikePatterns` there.
 *
 * @example
 * buildSearchTerms("Küb ra") // ["kub ra", "kub", "ra"]
 */
export const buildSearchTerms = (query: string): Array<string> => {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  const terms = [normalized, ...normalized.split(" ")];
  return Array.from(new Set(terms.filter(Boolean)));
};

/**
 * In-memory OR match: any term is a substring of any field (`toLowerCase`, not TR-fold).
 * Empty `terms` matches everything. Not for live queries.
 *
 * @example
 * includesAnySearchTerm(["kub"], ["Kübra"]) // true via toLowerCase, not TR fold
 */
export const includesAnySearchTerm = (
  terms: ReadonlyArray<string>,
  fields: ReadonlyArray<string | undefined | null>,
): boolean => {
  if (terms.length === 0) return true;

  return fields.some((field) => {
    if (!field) return false;
    const normalized = field.toLowerCase();
    return terms.some((term) => normalized.includes(term));
  });
};

/**
 * In-memory match: TR-fold, then substring or subsequence on each field and on
 * the joined / whitespace-stripped haystack (`aco` hits `Ahmet Cevdet`).
 *
 * Client `Array.filter` only — subsequence cannot be expressed as `ILIKE`.
 * Empty `rawTerm` matches everything.
 *
 * @example
 * includesFlexibleSearchTerm("aco", ["Ahmet Cevdet"]) // true (subsequence)
 */
export function includesFlexibleSearchTerm(
  rawTerm: string,
  fields: ReadonlyArray<string>,
): boolean {
  const term = normalizeSearchText(rawTerm);
  if (!term.length) return true;

  const normalizedFields = fields.map((field) => normalizeSearchText(field));
  const combinedHaystack = normalizedFields.join(" ");
  if (combinedHaystack.includes(term)) return true;
  if (isSubsequenceMatch(term, combinedHaystack)) return true;

  const compactTerm = term.replace(/\s+/g, "");
  if (!compactTerm.length) return true;

  const compactFields = normalizedFields.map((field) => field.replace(/\s+/g, ""));
  const combinedCompactHaystack = compactFields.join("");

  if (combinedCompactHaystack.includes(compactTerm)) return true;
  if (isSubsequenceMatch(compactTerm, combinedCompactHaystack)) return true;

  return normalizedFields.some((field, index) => {
    if (field.includes(term)) return true;
    if (isSubsequenceMatch(term, field)) return true;
    const compactField = compactFields[index] ?? field.replace(/\s+/g, "");
    if (compactField.includes(compactTerm)) return true;
    return isSubsequenceMatch(compactTerm, compactField);
  });
}
