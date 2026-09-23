import { describe, expect, test } from "bun:test";
import { defaultStreamModuleId } from "../lib/naming";

describe("defaultStreamModuleId", () => {
  test("uses filename-module for scaffolds", () => {
    expect(defaultStreamModuleId("presence")).toBe("presence-module");
    expect(defaultStreamModuleId("xxx")).toBe("xxx-module");
  });
});
