/** Shared DO module source parsing for codegen tasks. */

export type ParsedDoCollection = {
  name: string;
  primaryKey: string;
  indexes: Array<string>;
};

export type ParsedDoModule = {
  moduleId: string;
  streamEpoch: string | null;
  streamLive: string | null;
  streamPersist: boolean | null;
  collections: Array<ParsedDoCollection>;
};

const DEFAULT_STREAM_LIVE = "long-poll";
const DEFAULT_PERSIST = false;

export { DEFAULT_STREAM_LIVE, DEFAULT_PERSIST };

export function readStringProp(source: string, propName: string): string | null {
  const re = new RegExp(`${propName}\\s*:\\s*["']([^"']+)["']`);
  return re.exec(source)?.[1] ?? null;
}

export function readBoolProp(source: string, propName: string): boolean | null {
  const re = new RegExp(`${propName}\\s*:\\s*(true|false)\\b`);
  const hit = re.exec(source)?.[1];
  if (hit === "true") return true;
  if (hit === "false") return false;
  return null;
}

/** Parse `propName: ["a", "b"]` (string literals only). Missing → []. */
export function readStringArrayProp(source: string, propName: string): Array<string> {
  const re = new RegExp(`${propName}\\s*:\\s*\\[`);
  const hit = re.exec(source);
  if (!hit) return [];
  const start = hit.index + hit[0].length - 1;
  if (source[start] !== "[") return [];
  let depth = 0;
  let inString: '"' | "'" | null = null;
  let escape = false;
  let end = -1;
  for (let i = start; i < source.length; i++) {
    const ch = source[i]!;
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = ch;
      continue;
    }
    if (ch === "[") depth += 1;
    else if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) return [];
  const body = source.slice(start + 1, end);
  const values: Array<string> = [];
  const lit = /["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = lit.exec(body))) {
    values.push(m[1]!);
  }
  return values;
}

/** Extract balanced `{ ... }` body starting at `openBraceIndex` (must be `{`). */
export function sliceBalancedObject(source: string, openBraceIndex: number): string | null {
  if (source[openBraceIndex] !== "{") return null;
  let depth = 0;
  let inString: '"' | "'" | "`" | null = null;
  let escape = false;
  for (let i = openBraceIndex; i < source.length; i++) {
    const ch = source[i]!;
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(openBraceIndex + 1, i);
    }
  }
  return null;
}

function readCollectionsBlock(source: string): string | null {
  const hit = /collections\s*:\s*\{/.exec(source);
  if (!hit) return null;
  const open = hit.index + hit[0].length - 1;
  return sliceBalancedObject(source, open);
}

/** Top-level keys in a collections object body (depth-0 identifiers before `:`). */
export function listCollectionNames(collectionsBody: string): Array<string> {
  const names: Array<string> = [];
  let depth = 0;
  let inString: '"' | "'" | "`" | null = null;
  let escape = false;
  let i = 0;
  while (i < collectionsBody.length) {
    const ch = collectionsBody[i]!;
    if (inString) {
      if (escape) {
        escape = false;
        i += 1;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        i += 1;
        continue;
      }
      if (ch === inString) inString = null;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      i += 1;
      continue;
    }
    if (ch === "{") {
      depth += 1;
      i += 1;
      continue;
    }
    if (ch === "}") {
      depth -= 1;
      i += 1;
      continue;
    }
    if (depth === 0) {
      const key = /^([A-Za-z_][\w]*)\s*:/.exec(collectionsBody.slice(i));
      if (key) {
        names.push(key[1]!);
        i += key[0].length;
        continue;
      }
    }
    i += 1;
  }
  return names;
}

function collectionBodyFor(collectionsBody: string, name: string): string | null {
  // Bare `{ ... }` or schema-helper wrap: `doTable({ ... })`.
  const re = new RegExp(`(?:^|[\\s,{])${name}\\s*:\\s*(?:doTable\\s*\\(\\s*)?\\{`);
  const hit = re.exec(collectionsBody);
  if (!hit) return null;
  const open = hit.index + hit[0].length - 1;
  if (collectionsBody[open] !== "{") return null;
  return sliceBalancedObject(collectionsBody, open);
}

export function parseDoModuleSource(source: string, fileBase: string): ParsedDoModule | null {
  const idHit = /createDoModule\((["'`])([^"'`]+)\1\)/.exec(source);
  if (!idHit) return null;
  const moduleId = idHit[2]!;
  if (moduleId !== fileBase) {
    throw new Error(
      `createDoModule("${moduleId}"): file basename must be "${fileBase}" (got createDoModule id mismatch)`,
    );
  }

  const collectionsBody = readCollectionsBlock(source);
  if (!collectionsBody) {
    throw new Error(`createDoModule("${moduleId}"): missing collections: { ... }`);
  }

  const names = listCollectionNames(collectionsBody);
  if (names.length === 0) {
    throw new Error(`createDoModule("${moduleId}"): collections must declare at least one shape`);
  }

  const collections: Array<ParsedDoCollection> = names.map((name) => {
    const body = collectionBodyFor(collectionsBody, name) ?? "";
    return {
      name,
      primaryKey: readStringProp(body, "primaryKey") ?? "id",
      indexes: readStringArrayProp(body, "indexes"),
    };
  });

  return {
    moduleId,
    streamEpoch: readStringProp(source, "streamEpoch"),
    streamLive: readStringProp(source, "streamLive"),
    streamPersist: readBoolProp(source, "streamPersist"),
    collections,
  };
}

export function resolveModuleLive(live: string | null): string {
  return live ?? DEFAULT_STREAM_LIVE;
}

export function resolveModulePersist(persist: boolean | null): boolean {
  return persist ?? DEFAULT_PERSIST;
}
