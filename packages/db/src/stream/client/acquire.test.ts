import { describe, expect, test } from "bun:test";
import { DurableStreamError, FetchError, StreamClosedError } from "@durable-streams/client";
import { isRecoverableStreamError } from "./acquire";

const fetchError = (status: number, message: string) =>
  new FetchError(status, message, undefined, {}, "https://example/_streams/x", message);

describe("isRecoverableStreamError", () => {
  test("treats gone, bad request, and stream closed as recoverable", () => {
    expect(isRecoverableStreamError(fetchError(410, "gone"))).toBe(true);
    expect(isRecoverableStreamError(fetchError(404, "missing"))).toBe(true);
    expect(isRecoverableStreamError(fetchError(400, "bad offset"))).toBe(true);
    expect(isRecoverableStreamError(new StreamClosedError("https://example/_streams/x"))).toBe(
      true,
    );
    expect(isRecoverableStreamError(new DurableStreamError("bad", "BAD_REQUEST", 400))).toBe(true);
  });

  test("ignores unrelated errors", () => {
    expect(isRecoverableStreamError(fetchError(500, "server"))).toBe(false);
    expect(isRecoverableStreamError(new Error("boom"))).toBe(false);
  });
});
