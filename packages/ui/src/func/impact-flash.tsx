import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { useImpactOnChange } from "@monrep/hooks";
import type { TImpactValue } from "@monrep/hooks";

const IMPACT_ANIMATION_NAME = "ui-impact";

export type ImpactFlashProps = useRender.ComponentProps<"div"> & {
  watch?: TImpactValue;
  flashOnMount?: boolean;
};

/**
 * One-shot splash when `watch` changes after mount (safe with virtualized remounts).
 * Prefer `render={(p) => <Child {...p} />}` (Base UI function path — no cloneElement).
 * Pass `flashOnMount` only for non-recycled surfaces that should splash on first paint.
 */
export function ImpactFlash({
  watch,
  flashOnMount,
  className,
  render,
  children,
  ...props
}: ImpactFlashProps) {
  const { ref, handleImpactAnimationEnd } = useImpactOnChange(
    watch,
    IMPACT_ANIMATION_NAME,
    flashOnMount,
  );

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        ref,
        className,
        onAnimationEnd: handleImpactAnimationEnd,
        children,
      },
      props,
    ),
    render,
    state: { slot: "impact-flash" },
  });
}
