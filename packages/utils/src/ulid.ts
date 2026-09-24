import { monotonicFactory, ulid } from "ulid";

/** Live/null seeds only — must not share state with WA-time seeds (would clamp history to "now"). */
const nextLiveUlid = monotonicFactory();

/**
 * ULID whose timestamp bits become `created_at` (`id::timestamp`).
 * - `at` set → encode that instant directly (`ulid(ms)`), so backfill/webhook order matches send time.
 * - `at` null → monotonic live clock for app-generated rows.
 */
export function nextUlid(at: string | null | undefined): string {
  if (!at) return nextLiveUlid();
  const seedMs = Date.parse(at);
  return ulid(Number.isFinite(seedMs) ? seedMs : Date.now());
}
