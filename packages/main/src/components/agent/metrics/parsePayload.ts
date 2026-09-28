type SamplePayloadBody = {
  stream?: string;
  line?: string;
  level?: string;
  code?: string;
  message?: string;
  exit_code?: number;
};

export type SamplePayload = {
  op: string;
  collector?: string;
  body: SamplePayloadBody | null;
};

export function parseSamplePayload(raw: string): SamplePayload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const rec = parsed as Record<string, unknown>;
  const op = rec.op;
  if (typeof op !== "string") return null;

  const collector = typeof rec.collector === "string" ? rec.collector : undefined;
  let body: SamplePayloadBody | null = null;
  if (rec.body !== null && typeof rec.body === "object") {
    const b = rec.body as Record<string, unknown>;
    body = {};
    if (typeof b.stream === "string") body.stream = b.stream;
    if (typeof b.line === "string") body.line = b.line;
    if (typeof b.level === "string") body.level = b.level;
    if (typeof b.code === "string") body.code = b.code;
    if (typeof b.message === "string") body.message = b.message;
    if (typeof b.exit_code === "number") body.exit_code = b.exit_code;
  }
  return { op, collector, body };
}
