import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@monrep/utils";
import { badgeVariants } from "./badge-variants";
import type { VariantProps } from "class-variance-authority";

export type BadgeProps = useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export const Badge = ({ className, variant, size, disabled, render, ...props }: BadgeProps) => {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ className, variant, size, disabled })),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
};
