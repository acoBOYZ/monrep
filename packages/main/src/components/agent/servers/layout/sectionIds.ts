export const SERVER_SECTIONS = ["meta", "metrics", "ops", "pty"] as const;

export type ServerSectionId = (typeof SERVER_SECTIONS)[number];

export const DEFAULT_ORDER: ReadonlyArray<ServerSectionId> = [...SERVER_SECTIONS];

export const SECTION_LABEL: Record<ServerSectionId, string> = {
  meta: "Server meta",
  metrics: "Metrics",
  ops: "Ops glance",
  pty: "Shell",
};

const SECTION_SET = new Set<string>(SERVER_SECTIONS);

export function isServerSectionId(value: unknown): value is ServerSectionId {
  return typeof value === "string" && SECTION_SET.has(value);
}

/** Dedupe, keep known ids, append any missing defaults. */
export function normalizeOrder(raw: ReadonlyArray<unknown> | undefined): Array<ServerSectionId> {
  const seen = new Set<ServerSectionId>();
  const out: Array<ServerSectionId> = [];
  if (raw) {
    for (const item of raw) {
      if (!isServerSectionId(item) || seen.has(item)) continue;
      seen.add(item);
      out.push(item);
    }
  }
  for (const id of SERVER_SECTIONS) {
    if (seen.has(id)) continue;
    out.push(id);
  }
  return out;
}

export const SERVER_SECTION_DRAG_TYPE = "server-section" as const;

export type ServerSectionDragData = {
  type: typeof SERVER_SECTION_DRAG_TYPE;
  id: ServerSectionId;
  index: number;
};

export function isServerSectionDragData(
  data: Record<string | symbol, unknown>,
): data is ServerSectionDragData {
  return data.type === SERVER_SECTION_DRAG_TYPE;
}

export function sectionDragData(id: ServerSectionId, index: number): ServerSectionDragData {
  return { type: SERVER_SECTION_DRAG_TYPE, id, index };
}
