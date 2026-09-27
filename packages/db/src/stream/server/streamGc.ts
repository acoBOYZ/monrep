import { getPreviousEpoch } from "../common/streamEpoch";
import { physicalStreamPath } from "../common/streamPaths";
import type { TStreamEpoch } from "../../module";

type StreamGcBase = (request: Request, env: unknown) => Promise<Response>;

export type MaybeDeletePreviousPhysicalOpts = {
  moduleId: string;
  epoch: TStreamEpoch;
  now: Date;
  /** Query `offset`. GC only on fresh subscribe (`null` or `"-1"`). */
  offset: string | null;
  currentPath: string;
  requestUrl: URL;
  requestHeaders: Headers;
  base: StreamGcBase;
  env: unknown;
};

/**
 * After a bucket rotates, DELETE the previous physical path so Durable Streams
 * does not keep an empty leftover. Fire-and-forget via `waitUntil`.
 *
 * @returns `null` when nothing to do; otherwise a DELETE promise.
 */
export function maybeDeletePreviousPhysicalStream(
  opts: MaybeDeletePreviousPhysicalOpts,
): Promise<Response> | null {
  if (opts.offset !== null && opts.offset !== "-1") return null;

  const prevPath = physicalStreamPath(opts.moduleId, getPreviousEpoch(opts.epoch, opts.now));
  if (prevPath === opts.currentPath) return null;

  return opts.base(
    new Request(new URL(prevPath, opts.requestUrl), {
      method: "DELETE",
      headers: opts.requestHeaders,
    }),
    opts.env,
  );
}
