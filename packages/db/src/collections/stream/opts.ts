import type { DurableStream, LiveMode } from "@durable-streams/client";
import type { CreateStreamDBOptions } from "@durable-streams/state/db";

/** Shared createStreamDB inputs; schema, actions, and default live stay per-module in codegen. */
export type CreateDoModuleDbOpts = {
  stream: DurableStream;
  onBatch?: CreateStreamDBOptions["onBatch"];
  onBeforeBatch?: CreateStreamDBOptions["onBeforeBatch"];
  /** Overrides registry live for this open. */
  live?: LiveMode;
};
