import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cn } from "@monrep/utils";
import { toggleVariants } from "./toggle.variants";
import type { VariantProps } from "class-variance-authority";

export const Toggle = ({
  className,
  variant,
  size,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) => {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
};
