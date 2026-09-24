import { describe, expect, test } from "bun:test";
import {
  listCollectionNames,
  parseDoModuleSource,
  resolveModuleLive,
  resolveModulePersist,
  sliceBalancedObject,
} from "../lib/parse-do-module";
import { doModuleEpochMap } from "./do-index";

const sessionSource = `
import { z } from "zod";
import { createDoModule } from "./create-do-module.gen";

export default createDoModule("session")({
  streamLive: "sse",
  streamPersist: false,
  streamEpoch: "utc-day",
  collections: {
    presence: {
      type: "presence",
      primaryKey: "userId",
      schema: {
        userId: z.string(),
        name: z.string().optional(),
      },
    },
    typing: {
      type: "typing",
      primaryKey: "userId",
      schema: {
        userId: z.string(),
      },
    },
  },
});
`;

const sessionDoColSource = `
import { z } from "zod";
import { createDoModule, doTable } from "./create-do-module.gen";

export default createDoModule("session")({
  streamLive: "sse",
  streamPersist: false,
  collections: {
    users: doTable({
      type: "users",
      primaryKey: "id",
      schema: {
        id: z.string(),
        name: z.string(),
      },
      onInsert: ({ ctx }) => ({
        id: ctx.ulid,
      }),
    }),
    presence: doTable({
      type: "presence",
      primaryKey: "userId",
      indexes: ["userId"],
      schema: {
        userId: z.string(),
        name: z.string().optional(),
      },
    }),
    typing: doTable({
      type: "typing",
      primaryKey: "userId",
      schema: {
        userId: z.string(),
      },
    }),
  },
});
`;

describe("parseDoModuleSource", () => {
  test("extracts module flags and nested collections", () => {
    const parsed = parseDoModuleSource(sessionSource, "session");
    expect(parsed).toEqual({
      moduleId: "session",
      streamEpoch: "utc-day",
      streamLive: "sse",
      streamPersist: false,
      collections: [
        { name: "presence", type: "presence", primaryKey: "userId", indexes: [] },
        { name: "typing", type: "typing", primaryKey: "userId", indexes: [] },
      ],
    });
  });

  test("unwraps doTable({ ... }) collection props", () => {
    const parsed = parseDoModuleSource(sessionDoColSource, "session");
    expect(parsed).toEqual({
      moduleId: "session",
      streamEpoch: null,
      streamLive: "sse",
      streamPersist: false,
      collections: [
        { name: "users", type: "users", primaryKey: "id", indexes: [] },
        {
          name: "presence",
          type: "presence",
          primaryKey: "userId",
          indexes: ["userId"],
        },
        { name: "typing", type: "typing", primaryKey: "userId", indexes: [] },
      ],
    });
  });

  test("defaults live/persist when omitted", () => {
    const source = `
export default createDoModule("users")({
  collections: {
    users: {
      type: "users",
      primaryKey: "id",
      schema: { id: z.string() },
    },
  },
});
`;
    const parsed = parseDoModuleSource(source, "users");
    expect(parsed?.streamLive).toBeNull();
    expect(parsed?.streamPersist).toBeNull();
    expect(resolveModuleLive(parsed!.streamLive)).toBe("long-poll");
    expect(resolveModulePersist(parsed!.streamPersist)).toBe(false);
  });

  test("throws when createDoModule id mismatches file basename", () => {
    expect(() => parseDoModuleSource(sessionSource, "other")).toThrow(
      /file basename must be "other"/,
    );
  });
});

describe("listCollectionNames", () => {
  test("reads top-level keys inside collections body", () => {
    const open = sessionSource.indexOf("collections:");
    const brace = sessionSource.indexOf("{", open);
    const body = sliceBalancedObject(sessionSource, brace)!;
    expect(listCollectionNames(body)).toEqual(["presence", "typing"]);
  });
});

describe("doModuleEpochMap", () => {
  test("emits only declared epochs", () => {
    expect(
      doModuleEpochMap([
        { moduleId: "session", streamEpoch: "utc-day" },
        { moduleId: "metrics", streamEpoch: "utc-hour" },
        { moduleId: "users", streamEpoch: null },
      ]),
    ).toEqual({
      session: "utc-day",
      metrics: "utc-hour",
    });
  });
});
