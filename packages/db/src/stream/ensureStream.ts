import { DurableStream, DurableStreamError } from "@durable-streams/client";
import type { DurableStreamOptions } from "@durable-streams/client";

/** Create-only PUT when the physical stream does not exist yet (idempotent). */
export async function ensureStream(options: DurableStreamOptions): Promise<DurableStream> {
  const handle = new DurableStream(options);
  const head = await handle.head();
  if (head.exists) return handle;

  try {
    await handle.create({ contentType: options.contentType ?? "application/json" });
  } catch (error) {
    if (error instanceof DurableStreamError && error.code === "CONFLICT_EXISTS") {
      return handle;
    }
    throw error;
  }

  return handle;
}
