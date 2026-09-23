import type { DurableStream, LiveMode } from "@durable-streams/client";
import type { CreateStreamDBOptions } from "@durable-streams/state/db";
import type { TDoModuleId } from "../../types";
import type { DO_MODULE_DB_FACTORIES } from "../collections.do.gen";

/** Shared createStreamDB inputs; schema, actions, and default live stay per-module in codegen. */
export type CreateDoModuleDbOpts = {
  stream: DurableStream;
  onBatch?: CreateStreamDBOptions["onBatch"];
  onBeforeBatch?: CreateStreamDBOptions["onBeforeBatch"];
  /** Overrides `DO_MODULE_LIVE`. */
  live?: LiveMode;
};

export type DoStreamDb<TModule extends TDoModuleId> = ReturnType<
  (typeof DO_MODULE_DB_FACTORIES)[TModule]
>;
