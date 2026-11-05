import { startTransition, useEffect, useState } from "react";
import { boxes } from "@monrep/utils";

/**
 * Returns `true` after the browser has painted `delayFrames` times.
 *
 * First render is always `false`. An effect then waits that many
 * `requestAnimationFrame` callbacks and flips the flag with
 * `startTransition`, so the follow-up render is non-urgent and does not
 * sit on the same task as the click / navigation that mounted the tree.
 *
 * Use this to paint a shell (skeletons, chrome) first, then enable
 * expensive work such as `useLiveQuery` subscribe / `startSync`.
 *
 * `delayFrames` defaults to `1` (the next frame after paint). Pass `2+`
 * to stagger sibling islands onto later frames. Changing `delayFrames`
 * after the flag is already `true` does not reset it.
 *
 * @example
 * ```tsx
 * const queriesEnabled = useAfterPaint();
 * const { data } = useLiveQuery({
 *   query: (q) => {
 *   if (!queriesEnabled || !teamId) return undefined;
 *   return q.from({ t: collection }).where(({ t }) => eq(t.team_id, teamId));
 *   }
 * });
 * ```
 */
export function useAfterPaint(delayFrames = 1) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frameId = { current: 0 };
    const { cancelled, framesLeft } = boxes({
      cancelled: false,
      framesLeft: delayFrames,
    });

    const tick = () => {
      if (cancelled.current) return;
      framesLeft.current -= 1;
      if (framesLeft.current <= 0) {
        startTransition(() => {
          if (!cancelled.current) setReady(true);
        });
        return;
      }
      frameId.current = requestAnimationFrame(tick);
    };

    frameId.current = requestAnimationFrame(tick);
    return () => {
      cancelled.current = true;
      cancelAnimationFrame(frameId.current);
    };
  }, [delayFrames]);

  return ready;
}
