import { describe, expect, test } from "bun:test";
import { EPOCH_EXPIRE_GRACE_MS, getExpiresAtByEpoch, nextEpochBoundary } from "./streamEpoch";

describe("nextEpochBoundary", () => {
  test("utc-hour advances to the next UTC hour", () => {
    const now = new Date("2026-09-27T14:37:12.345Z");
    expect(nextEpochBoundary("utc-hour", now).toISOString()).toBe("2026-09-27T15:00:00.000Z");
  });

  test("utc-day advances to the next UTC midnight", () => {
    const now = new Date("2026-09-27T14:37:12.345Z");
    expect(nextEpochBoundary("utc-day", now).toISOString()).toBe("2026-09-28T00:00:00.000Z");
  });
});

describe("getExpiresAtByEpoch", () => {
  test("utc-hour expires at next hour + grace", () => {
    const now = new Date("2026-09-27T14:37:12.345Z");
    const expected = new Date(nextEpochBoundary("utc-hour", now).getTime() + EPOCH_EXPIRE_GRACE_MS);
    expect(getExpiresAtByEpoch("utc-hour", now).toISOString()).toBe(expected.toISOString());
  });

  test("utc-day expires at next midnight + grace", () => {
    const now = new Date("2026-09-27T14:37:12.345Z");
    const expected = new Date(nextEpochBoundary("utc-day", now).getTime() + EPOCH_EXPIRE_GRACE_MS);
    expect(getExpiresAtByEpoch("utc-day", now).toISOString()).toBe(expected.toISOString());
  });
});
